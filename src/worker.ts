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

export default {
  fetch: handle,

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
