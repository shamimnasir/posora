import type { APIRoute } from 'astro';
import { isLoggedIn, sameOrigin } from '../../../lib/auth';
import { requireDb } from '../../../lib/db';
import { grantPlan, revokePlan, grantEntitlement, revokeEntitlement, ensureMember, isEmail, normalizeEmail, PLAN_DIGITAL_PACK } from '../../../lib/members';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

async function audit(action: string, target: string, detail: string) {
  await requireDb().prepare('INSERT INTO audit (at, action, target, detail) VALUES (?, ?, ?, ?)').bind(Date.now(), action, target, detail.slice(0, 500)).run();
}

/**
 * Admin control over membership. Until a payment rail exists this is the only
 * way a family gets the plan, so every grant and revoke is written to the
 * audit trail with the note the admin typed.
 */
export const POST: APIRoute = async (ctx) => {
  const { request, url } = ctx;
  if (!sameOrigin(request, url)) return json({ ok: false, error: 'origin' }, 403);
  if (!(await isLoggedIn(ctx))) return json({ ok: false, error: 'auth' }, 401);
  let body: { op?: unknown; memberId?: unknown; email?: unknown; name?: unknown; days?: unknown; note?: unknown };
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad-json' }, 400); }
  const memberId = typeof body.memberId === 'string' ? body.memberId : '';
  const note = typeof body.note === 'string' ? body.note.trim() : '';
  try {
    switch (body.op) {
      case 'grant': {
        if (!memberId) return json({ ok: false, error: 'invalid' }, 422);
        const days = body.days === null ? null : Number(body.days);
        if (days !== null && (!Number.isInteger(days) || days < 1 || days > 3650)) return json({ ok: false, error: 'days' }, 422);
        await grantPlan(memberId, days, note, 'admin');
        await audit('member.grant', memberId, `family, ${days === null ? 'no end' : `${days} days`}${note ? `, ${note}` : ''}`);
        return json({ ok: true });
      }
      case 'revoke': {
        if (!memberId) return json({ ok: false, error: 'invalid' }, 422);
        await revokePlan(memberId);
        await audit('member.revoke', memberId, note);
        return json({ ok: true });
      }
      case 'bundle-grant': {
        if (!memberId) return json({ ok: false, error: 'invalid' }, 422);
        await grantEntitlement(memberId, PLAN_DIGITAL_PACK, null, note, 'admin');
        await audit('bundle.access.grant', memberId, note || 'manual support grant');
        return json({ ok: true });
      }
      case 'bundle-revoke': {
        if (!memberId) return json({ ok: false, error: 'invalid' }, 422);
        await revokeEntitlement(memberId, PLAN_DIGITAL_PACK);
        await audit('bundle.access.revoke', memberId, note || 'manual support revoke');
        return json({ ok: true });
      }
      case 'add': {
        const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
        if (!isEmail(email)) return json({ ok: false, error: 'email' }, 422);
        const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 80) : null;
        const id = await ensureMember(email, name);
        await audit('member.add', id, email);
        return json({ ok: true, id });
      }
      default:
        return json({ ok: false, error: 'op' }, 400);
    }
  } catch (err) {
    console.error('admin member op failed', err);
    return json({ ok: false, error: 'failed' }, 500);
  }
};

export const ALL: APIRoute = () => json({ ok: false, error: 'method' }, 405);
