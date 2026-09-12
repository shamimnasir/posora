import type { APIRoute } from 'astro';
import { sameOrigin } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { consumeCode, MEMBER_COOKIE, cookieOptions } from '../../../lib/members';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

/**
 * Sign in with the six digit code from the email.
 *
 * This is the path that works everywhere. The link in the same email can be
 * eaten by a mail scanner, and on a phone it opens inside the mail app's own
 * browser, where the session cookie is stranded away from the browser the
 * parent actually uses. Typing six digits into the tab that is already open
 * has neither problem.
 *
 * Guessing is capped where it belongs: on the sign-in request itself, which
 * `consumeCode` kills after five wrong codes, on top of the five requests an
 * hour per address that `requestMagicLink` already allows. That is at most
 * twenty five guesses an hour against a million, for one address.
 *
 * Deliberately NOT capped per IP. The first version of this route reused the
 * admin panel's throttle, which locks an IP out for fifteen minutes after
 * three failures, and testing showed it firing before the real guard. Two
 * things wrong with it: most Bangladeshi mobile traffic shares a handful of
 * carrier-NAT addresses, so one parent fat-fingering their code would have
 * locked out every other user on that carrier; and it writes to the same
 * table as the admin login, so it would have locked the admin out too. The
 * per-request counter is scoped to exactly the thing under attack and needs
 * no such collateral.
 */
export const POST: APIRoute = async ({ request, url, cookies }) => {
  if (!sameOrigin(request, url)) return json({ ok: false, error: 'origin' }, 403);
  if (!db()) return json({ ok: false, error: 'unavailable' }, 503);
  if (request.headers.get('content-type')?.includes('application/json') !== true) return json({ ok: false, error: 'bad-request' }, 415);

  let body: { email?: unknown; code?: unknown };
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad-json' }, 400); }
  const email = typeof body.email === 'string' ? body.email : '';
  const code = typeof body.code === 'string' ? body.code : '';

  try {
    const r = await consumeCode(email, code, request.headers.get('user-agent'));
    if (!r.ok) return json({ ok: false, error: r.error }, 401);
    cookies.set(MEMBER_COOKIE, r.session, cookieOptions(url.protocol === 'https:'));
    return json({ ok: true });
  } catch (err) {
    console.error('code sign-in failed', err);
    return json({ ok: false, error: 'failed' }, 500);
  }
};

export const ALL: APIRoute = () => json({ ok: false, error: 'method' }, 405);
