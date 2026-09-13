import type { APIRoute } from 'astro';
import { sameOrigin, clientIp } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { signInWithPassword, MEMBER_COOKIE, cookieOptions } from '../../../lib/members';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

/**
 * Sign in with an email and a password.
 *
 * A wrong address and a wrong password answer identically, so the form cannot
 * be used to find out who has an account here. `unverified` is the one case
 * that says more, and only to somebody who already knows the password.
 *
 * Throttled per address and per IP through `member_throttle`, which is a
 * separate table from the admin panel's: the same mistake was found in the
 * code route, where an IP lock would have shut out every parent behind one
 * carrier NAT and the admin along with them.
 */
export const POST: APIRoute = async ({ request, url, cookies }) => {
  if (!sameOrigin(request, url)) return json({ ok: false, error: 'origin' }, 403);
  if (!db()) return json({ ok: false, error: 'unavailable' }, 503);
  if (request.headers.get('content-type')?.includes('application/json') !== true) return json({ ok: false, error: 'bad-request' }, 415);

  let body: { email?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad-json' }, 400); }
  const email = typeof body.email === 'string' ? body.email : '';
  const password = typeof body.password === 'string' ? body.password : '';

  try {
    const r = await signInWithPassword(email, password, request.headers.get('user-agent'), clientIp(request));
    if (!r.ok) return json({ ok: false, error: r.error }, r.error === 'throttled' ? 429 : 401);
    cookies.set(MEMBER_COOKIE, r.session, cookieOptions(url.protocol === 'https:'));
    return json({ ok: true });
  } catch (err) {
    console.error('password sign-in failed', err);
    return json({ ok: false, error: 'failed' }, 500);
  }
};

export const ALL: APIRoute = () => json({ ok: false, error: 'method' }, 405);
