/**
 * The Worker entry.
 *
 * Astro's Cloudflare adapter ships an entry that is exactly `{ fetch: handle }`.
 * This is that entry plus a `scheduled` handler, because a Cloudflare cron
 * trigger calls `scheduled` and nothing else, and the weekly letter to parents
 * is the one thing on this site that has to happen without anybody visiting.
 *
 * Everything the site serves still goes through the adapter's own `handle`,
 * untouched. If this file ever grows a second responsibility, it is in the
 * wrong place.
 */
import { handle } from '@astrojs/cloudflare/handler';
import { runWeekly, type Mail } from './lib/weekly';

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
   */
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil((async () => {
      try {
        const r = await runWeekly({
          origin: env.SITE_ORIGIN ?? 'https://posora.com',
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
    void event;
  },
};
