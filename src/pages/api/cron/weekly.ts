import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { isLoggedIn } from '../../../lib/auth';
import { runWeekly, type Mail } from '../../../lib/weekly';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

type Env = {
  EMAIL?: Mail;
  CONTACT_FROM?: string;
  /** Shared secret for an outside scheduler. Set with `wrangler secret put CRON_SECRET`. */
  CRON_SECRET?: string;
};

/**
 * The weekly letter run, by hand.
 *
 * The scheduled path is the cron trigger in wrangler.jsonc, which calls
 * `scheduled` in src/worker.ts. This endpoint exists for the two cases a cron
 * trigger does not cover: an admin at the keyboard checking the wording or
 * re-running after a failure, and an outside scheduler for anyone who would
 * rather not depend on Cloudflare's. All three call the same `runWeekly`, and
 * the run is idempotent by week, so pressing the button after the cron has
 * already fired sends nothing.
 *
 * `?dry=1` builds every letter, writes nothing and sends nothing.
 */
export const POST: APIRoute = async (ctx) => {
  const { request, url } = ctx;
  const e = env as unknown as Env;

  // Either an admin at the keyboard, or a scheduler with the secret. The
  // secret is compared only when one is configured, so a deployment without
  // it simply has no machine path in.
  const auth = request.headers.get('authorization') ?? '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const bySecret = !!e.CRON_SECRET && bearer.length === e.CRON_SECRET.length && bearer === e.CRON_SECRET;
  if (!bySecret && !(await isLoggedIn(ctx))) return json({ ok: false, error: 'auth' }, 401);

  const dry = url.searchParams.get('dry') === '1';
  if (!dry && !e.EMAIL) return json({ ok: false, error: 'email-unavailable' }, 503);

  try {
    return json(await runWeekly({ origin: url.origin, mail: e.EMAIL, from: e.CONTACT_FROM, dry }));
  } catch (err) {
    return json({ ok: false, error: (err as Error).message }, 500);
  }
};
