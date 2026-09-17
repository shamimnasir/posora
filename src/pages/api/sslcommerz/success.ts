import type { APIRoute } from 'astro';
import { settlePayment } from '../../../lib/sslcommerz';

export const prerender = false;

const back = (url: URL, status: string, tranId: string) => new Response(null, {
  status: 303,
  headers: { location: `${url.origin}/digital-pack/confirmation/?status=${encodeURIComponent(status)}&tran_id=${encodeURIComponent(tranId)}`, 'cache-control': 'no-store' },
});

async function payload(request: Request): Promise<Record<string, unknown>> {
  if (request.method === 'GET') return Object.fromEntries(new URL(request.url).searchParams.entries());
  try { return Object.fromEntries((await request.formData()).entries()); } catch { return {}; }
}

export const ALL: APIRoute = async ({ request, url }) => {
  const body = await payload(request);
  const tranId = String(body.tran_id ?? '');
  const result = await settlePayment(body);
  return back(url, result === 'paid' ? 'success' : result === 'held' ? 'review' : 'failed', tranId);
};
