import type { APIRoute } from 'astro';
import { sameOrigin } from '../../../lib/auth';
import { getMember, addChild, updateChild, removeChild, CHILD_COOKIE, childCookieOptions, type Level } from '../../../lib/members';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const LEVELS: Level[] = ['l1', 'l2', 'l3'];

/**
 * Manage a member's children. A child is a nickname and a reading level, and
 * that is deliberately all the shape allows; there is no field for anything
 * else and none will be added here.
 */
export const POST: APIRoute = async (ctx) => {
  const { request, url, cookies } = ctx;
  if (!sameOrigin(request, url)) return json({ ok: false, error: 'origin' }, 403);
  const member = await getMember(ctx);
  if (!member) return json({ ok: false, error: 'signed-out' }, 401);
  let body: { op?: unknown; id?: unknown; nickname?: unknown; level?: unknown };
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad-json' }, 400); }

  const id = typeof body.id === 'string' ? body.id : '';
  const nickname = typeof body.nickname === 'string' ? body.nickname : '';
  const level = LEVELS.includes(body.level as Level) ? (body.level as Level) : 'l1';
  const secure = url.protocol === 'https:';

  try {
    switch (body.op) {
      case 'add': {
        const r = await addChild(member.id, nickname, level);
        if (r === 'full') return json({ ok: false, error: 'full' }, 409);
        if (r === 'invalid') return json({ ok: false, error: 'invalid' }, 422);
        // A newly added child becomes the active one on this device.
        cookies.set(CHILD_COOKIE, r.id, childCookieOptions(secure));
        return json({ ok: true, child: r });
      }
      case 'update': {
        const ok = await updateChild(member.id, id, nickname, level);
        return ok ? json({ ok: true }) : json({ ok: false, error: 'not-found' }, 404);
      }
      case 'remove': {
        const ok = await removeChild(member.id, id);
        if (cookies.get(CHILD_COOKIE)?.value === id) cookies.delete(CHILD_COOKIE, { path: '/' });
        return ok ? json({ ok: true }) : json({ ok: false, error: 'not-found' }, 404);
      }
      case 'select': {
        if (!member.children.some((c) => c.id === id)) return json({ ok: false, error: 'not-found' }, 404);
        cookies.set(CHILD_COOKIE, id, childCookieOptions(secure));
        return json({ ok: true });
      }
      default:
        return json({ ok: false, error: 'op' }, 400);
    }
  } catch (err) {
    console.error('children op failed', err);
    return json({ ok: false, error: 'failed' }, 500);
  }
};

export const ALL: APIRoute = () => json({ ok: false, error: 'method' }, 405);
