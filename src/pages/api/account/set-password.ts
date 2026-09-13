import type { APIRoute } from 'astro';
import { sameOrigin } from '../../../lib/auth';
import { getMember, setMemberPassword, MEMBER_COOKIE } from '../../../lib/members';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

/**
 * Set or change a password from inside the account.
 *
 * Without this the feature only half exists: every member who got here before
 * today, and everyone who signs in with the emailed code, would have no way to
 * ever have a password. It is also the whole of the reset flow. Forgetting a
 * password means signing in with a code and setting a new one here, so there
 * is no second secret-bearing email to build, expire and get wrong.
 */
export const POST: APIRoute = async (ctx) => {
  const { request, url, cookies } = ctx;
  if (!sameOrigin(request, url)) return json({ ok: false, error: 'origin' }, 403);
  const member = await getMember(ctx);
  if (!member) return json({ ok: false, error: 'signed-out' }, 401);

  let body: { password?: unknown; current?: unknown };
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad-json' }, 400); }
  const password = typeof body.password === 'string' ? body.password : '';
  const current = typeof body.current === 'string' ? body.current : '';

  try {
    const r = await setMemberPassword(member.id, password, current, cookies.get(MEMBER_COOKIE)?.value);
    if (r === 'ok') return json({ ok: true });
    return json({ ok: false, error: r }, r === 'wrong' ? 401 : 400);
  } catch (err) {
    console.error('set password failed', err);
    return json({ ok: false, error: 'failed' }, 500);
  }
};

export const ALL: APIRoute = () => json({ ok: false, error: 'method' }, 405);
