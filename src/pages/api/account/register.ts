import type { APIRoute } from 'astro';
import { sameOrigin, clientIp } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { registerWithPassword } from '../../../lib/members';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

/**
 * Create an account with an email and a password.
 *
 * No session comes back. The account is made, a six digit code goes to the
 * address, and nothing works until that code is typed in. Handing out a
 * session here would mean anyone could register with somebody else's address,
 * set a password on it, and be sitting inside the account when its real owner
 * signs in with a code later.
 *
 * `taken` is only answered for an address that has already been verified, so
 * the form still cannot be used to test who is a member: a stranger's address
 * that nobody has proved looks exactly like a free one, and registering
 * against it simply sends that person an email they did not ask for once.
 */
export const POST: APIRoute = async ({ request, url }) => {
  if (!sameOrigin(request, url)) return json({ ok: false, error: 'origin' }, 403);
  if (!db()) return json({ ok: false, error: 'unavailable' }, 503);
  if (request.headers.get('content-type')?.includes('application/json') !== true) return json({ ok: false, error: 'bad-request' }, 415);

  let body: { email?: unknown; password?: unknown; name?: unknown; website?: unknown };
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad-json' }, 400); }
  // A field no person can see and no person fills in. Answer a bot exactly as
  // we answer a parent, so it learns nothing from being refused.
  if (typeof body.website === 'string' && body.website.trim()) return json({ ok: true, needsCode: true });
  const email = typeof body.email === 'string' ? body.email : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const name = typeof body.name === 'string' ? body.name : '';

  try {
    const r = await registerWithPassword(email, password, name, url.origin, clientIp(request));
    if (!r.ok) return json({ ok: false, error: r.error }, r.error === 'throttled' ? 429 : 400);
    return json({ ok: true, needsCode: true });
  } catch (err) {
    console.error('register failed', err);
    return json({ ok: false, error: 'failed' }, 500);
  }
};

export const ALL: APIRoute = () => json({ ok: false, error: 'method' }, 405);
