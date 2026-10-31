import type { APIRoute } from 'astro';
import { settlePayment } from '../../../lib/sslcommerz';
import { confirmationUrl, orderByTran } from '../../../lib/shop';

export const prerender = false;

const back = (location: string) => new Response(null, { status: 303, headers: { location, 'cache-control': 'no-store' } });

async function payload(request: Request): Promise<Record<string, unknown>> {
  if (request.method === 'GET') return Object.fromEntries(new URL(request.url).searchParams.entries());
  try { return Object.fromEntries((await request.formData()).entries()); } catch { return {}; }
}

export const ALL: APIRoute = async ({ request, url }) => {
  const body = await payload(request);
  const tranId = String(body.tran_id ?? '');
  const result = await settlePayment(body, url.origin);
  // A paid order lands on its own download page straight away.
  const key = result === 'paid' ? (await orderByTran(tranId).catch(() => null))?.download_key : null;
  return back(confirmationUrl(url.origin, tranId, key, result === 'paid' ? 'success' : result === 'held' ? 'review' : 'failed'));
};
