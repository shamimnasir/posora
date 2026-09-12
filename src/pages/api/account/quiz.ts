import type { APIRoute } from 'astro';
import { sameOrigin } from '../../../lib/auth';
import { getMember, hasPlan, activeChild, saveQuizResult } from '../../../lib/members';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const SLUG = /^[a-z]{2,20}$/;
const int = (v: unknown, max: number) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max ? (v as number) : null);

/** Record a finished যাচাই for the active child. Family plan only. */
export const POST: APIRoute = async (ctx) => {
  const { request, url } = ctx;
  if (!sameOrigin(request, url)) return json({ ok: false, error: 'origin' }, 403);
  const member = await getMember(ctx);
  if (!member) return json({ ok: false, error: 'signed-out' }, 401);
  if (!hasPlan(member)) return json({ ok: false, error: 'no-plan' }, 403);
  const child = activeChild(ctx, member);
  if (!child) return json({ ok: false, error: 'no-child' }, 409);
  let body: { world?: unknown; cat?: unknown; score?: unknown; total?: unknown };
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad-json' }, 400); }
  const world = typeof body.world === 'string' ? body.world : '';
  const cat = int(body.cat, 50), total = int(body.total, 50), score = int(body.score, 50);
  if (!SLUG.test(world) || cat === null || total === null || score === null || score > total || total === 0) return json({ ok: false, error: 'invalid' }, 422);
  try {
    await saveQuizResult(child.id, world, cat, score, total);
    return json({ ok: true });
  } catch (err) {
    console.error('quiz save failed', err);
    return json({ ok: false, error: 'failed' }, 500);
  }
};

export const ALL: APIRoute = () => json({ ok: false, error: 'method' }, 405);
