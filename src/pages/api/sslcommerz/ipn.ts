import type { APIRoute } from 'astro';
import { settlePayment } from '../../../lib/sslcommerz';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown> = {};
  try { body = Object.fromEntries((await request.formData()).entries()); } catch { return new Response('bad request', { status: 400 }); }
  const result = await settlePayment(body);
  // SSLCommerz only needs a reachable 2xx listener. Do not leak order details
  // into the response body; the merchant panel and order ledger are the source
  // of truth.
  return new Response(result === 'failed' ? 'not settled' : 'ok', { status: result === 'failed' ? 422 : 200, headers: { 'cache-control': 'no-store' } });
};

export const ALL: APIRoute = () => new Response('method not allowed', { status: 405 });
