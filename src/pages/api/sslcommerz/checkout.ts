import type { APIRoute } from 'astro';
import { sameOrigin, clientIp } from '../../../lib/auth';
import { throttled } from '../../../lib/members';
import { initiateCheckout } from '../../../lib/sslcommerz';

export const prerender = false;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export const POST: APIRoute = async ({ request, url }) => {
  if (!sameOrigin(request, url)) return json({ ok: false, error: 'origin' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ ok: false, error: 'bad-request' }, 415);
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return json({ ok: false, error: 'bad-json' }, 400); }
  if (String(body.website ?? '').trim()) return json({ ok: true });
  // Each attempt is an order row and a call to the gateway; a buyer retrying
  // never needs more than a handful an hour.
  if (await throttled(`checkout:${clientIp(request)}`, 20, 60 * 60_000)) return json({ ok: false, error: 'throttled' }, 429);
  const result = await initiateCheckout({
    name: String(body.name ?? ''), email: String(body.email ?? ''), phone: String(body.phone ?? ''),
    address: String(body.address ?? ''), origin: url.origin,
  });
  if (result.ok) return json(result);
  return json(result, result.error === 'invalid' ? 422 : result.error === 'unavailable' ? 503 : 502);
};

export const ALL: APIRoute = () => json({ ok: false, error: 'method' }, 405);
