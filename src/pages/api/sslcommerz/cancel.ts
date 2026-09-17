import type { APIRoute } from 'astro';
import { markCallback } from '../../../lib/sslcommerz';

export const prerender = false;

async function payload(request: Request): Promise<Record<string, unknown>> {
  if (request.method === 'GET') return Object.fromEntries(new URL(request.url).searchParams.entries());
  try { return Object.fromEntries((await request.formData()).entries()); } catch { return {}; }
}

export const ALL: APIRoute = async ({ request, url }) => {
  const body = await payload(request);
  const tranId = String(body.tran_id ?? '');
  await markCallback(tranId, 'cancelled');
  return new Response(null, { status: 303, headers: { location: `${url.origin}/digital-pack/confirmation/?status=cancelled&tran_id=${encodeURIComponent(tranId)}`, 'cache-control': 'no-store' } });
};
