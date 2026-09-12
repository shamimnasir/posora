import type { APIRoute } from 'astro';
import { sameOrigin, clientIp } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { requestMagicLink, isEmail, normalizeEmail } from '../../../lib/members';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

/**
 * Send a one-time sign-in link. The response never reveals whether the
 * address belongs to a member; an unknown address just becomes a member the
 * first time its link is clicked.
 */
export const POST: APIRoute = async ({ request, url }) => {
  if (!sameOrigin(request, url)) return json({ ok: false, error: 'origin' }, 403);
  if (!db()) return json({ ok: false, error: 'unavailable' }, 503);
  if (request.headers.get('content-type')?.includes('application/json') !== true) return json({ ok: false, error: 'bad-request' }, 415);
  let body: { email?: unknown; website?: unknown };
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad-json' }, 400); }
  if (typeof body.website === 'string' && body.website.trim()) return json({ ok: true, result: 'sent' }); // honeypot
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
  if (!isEmail(email)) return json({ ok: false, error: 'invalid' }, 422);
  try {
    const result = await requestMagicLink(email, url.origin, clientIp(request));
    if (result === 'throttled') return json({ ok: false, error: 'throttled' }, 429);
    if (result === 'email-unavailable') return json({ ok: false, error: 'email-unavailable' }, 503);
    return json({ ok: true, result });
  } catch (err) {
    console.error('magic link failed', err);
    return json({ ok: false, error: 'send-failed' }, 502);
  }
};

export const ALL: APIRoute = () => json({ ok: false, error: 'method' }, 405);
