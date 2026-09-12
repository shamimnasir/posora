import type { APIRoute } from 'astro';
import { sameOrigin } from '../../../lib/auth';
import { getMember, hasPlan, activeChild, getChildProgress, mergeChildProgress } from '../../../lib/members';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const SLUG = /^[a-z]{2,20}$/;

/** Cross-device progress for the active child. Family plan only. */
export const GET: APIRoute = async (ctx) => {
  const member = await getMember(ctx);
  if (!member) return json({ ok: false, error: 'signed-out' }, 401);
  if (!hasPlan(member)) return json({ ok: false, error: 'no-plan' }, 403);
  const child = activeChild(ctx, member);
  if (!child) return json({ ok: true, keys: [] });
  const world = ctx.url.searchParams.get('world') ?? '';
  if (!SLUG.test(world)) return json({ ok: false, error: 'world' }, 422);
  try {
    return json({ ok: true, child: child.id, keys: await getChildProgress(child.id, world) });
  } catch (err) {
    console.error('progress read failed', err);
    return json({ ok: false, error: 'failed' }, 500);
  }
};

export const POST: APIRoute = async (ctx) => {
  const { request, url } = ctx;
  if (!sameOrigin(request, url)) return json({ ok: false, error: 'origin' }, 403);
  const member = await getMember(ctx);
  if (!member) return json({ ok: false, error: 'signed-out' }, 401);
  if (!hasPlan(member)) return json({ ok: false, error: 'no-plan' }, 403);
  const child = activeChild(ctx, member);
  if (!child) return json({ ok: false, error: 'no-child' }, 409);
  let body: { world?: unknown; keys?: unknown };
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad-json' }, 400); }
  const world = typeof body.world === 'string' ? body.world : '';
  if (!SLUG.test(world) || !Array.isArray(body.keys)) return json({ ok: false, error: 'invalid' }, 422);
  try {
    const added = await mergeChildProgress(child.id, world, body.keys.filter((k): k is string => typeof k === 'string'));
    return json({ ok: true, added });
  } catch (err) {
    console.error('progress merge failed', err);
    return json({ ok: false, error: 'failed' }, 500);
  }
};

export const ALL: APIRoute = () => json({ ok: false, error: 'method' }, 405);
