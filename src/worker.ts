/**
 * The Worker entry.
 *
 * Astro's Cloudflare adapter ships an entry that is exactly `{ fetch: handle }`.
 * This is that entry plus a `scheduled` handler, because a Cloudflare cron
 * trigger calls `scheduled` and nothing else, and the weekly letter to parents
 * is the one thing on this site that has to happen without anybody visiting.
 *
 * Everything the site serves still goes through the adapter's own `handle`,
 * untouched. The second scheduled job, settling stranded bKash payments, is
 * one call into src/lib/bkash.ts.
 */
import { handle } from '@astrojs/cloudflare/handler';
import { runWeekly, type Mail } from './lib/weekly';
import { reconcileBkash } from './lib/bkash';

/** Must match the second entry of `triggers.crons` in wrangler.jsonc. */
const RECONCILE_CRON = '*/5 * * * *';

type Env = {
  EMAIL?: Mail;
  CONTACT_FROM?: string;
  /** Where the letter's links point. Set in wrangler.jsonc. */
  SITE_ORIGIN?: string;
};

/**
 * One address per page. `www.posora.com` and `/blog` both served a full page,
 * and `/blog` even declared itself canonical, so search engines saw duplicates
 * of what the sitemap lists as `posora.com/blog/`. Only page reads redirect:
 * /api and files keep their paths, and a form post must not lose its body.
 */
function canonicalRedirect(request: Request): Response | null {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;
  const url = new URL(request.url);
  const isPage = !url.pathname.startsWith('/api/') && !url.pathname.split('/').pop()?.includes('.');
  const needsHost = url.hostname === 'www.posora.com';
  const needsSlash = isPage && !url.pathname.endsWith('/');
  if (!needsHost && !needsSlash) return null;
  if (needsHost) url.hostname = 'posora.com';
  if (needsSlash) url.pathname += '/';
  return new Response(null, { status: 301, headers: { location: url.href } });
}

export default {
  fetch(request: Request, env: Parameters<typeof handle>[1], ctx: ExecutionContext) {
    return canonicalRedirect(request) ?? handle(request, env, ctx);
  },

  /**
   * Fired by the cron trigger in wrangler.jsonc.
   *
   * The run is idempotent by week (see src/lib/weekly.ts), so a trigger that
   * fires twice, or a retry after a half-finished run, cannot put two letters
   * in one inbox. That matters more than usual here: cron triggers are
   * at-least-once, and the failure mode is a parent's inbox.
   *
   * `waitUntil` keeps the worker alive for the sends. Nothing is awaited by the
   * platform otherwise, and a letter half sent is worse than one not sent.
   *
   * The every-five-minutes trigger settles bKash orders whose buyer paid but
   * never made it back to the callback (see reconcileBkash).
   */
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const origin = env.SITE_ORIGIN ?? 'https://posora.com';
    if (event.cron === RECONCILE_CRON) {
      ctx.waitUntil(reconcileBkash(origin)
        .then((r) => { if (r.checked) console.log(`bKash reconcile: checked ${r.checked}, paid ${r.paid}, closed ${r.failed}`); })
        .catch((err) => console.error('bKash reconcile failed', err)));
      return;
    }
    ctx.waitUntil((async () => {
      try {
        const r = await runWeekly({
          origin,
          mail: env.EMAIL,
          from: env.CONTACT_FROM,
        });
        // Goes to the Workers log, which `wrangler tail` shows. There is no
        // dashboard for this and one line a week is the right amount of noise.
        console.log(`weekly letters ${r.week}: sent ${r.sent}, quiet ${r.quiet}, already ${r.already}, failed ${r.failed}, of ${r.members} members`);
      } catch (err) {
        console.error('weekly letters failed', err);
      }
    })());
  },
};
