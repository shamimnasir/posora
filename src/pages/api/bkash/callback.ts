import type { APIRoute } from 'astro';
import { finishBkash } from '../../../lib/bkash';

export const prerender = false;

/**
 * bKash sends the buyer back here with ?paymentID=&status=success|failure|cancel.
 * The status is only a hint: finishBkash executes and verifies with bKash.
 */
export const GET: APIRoute = async ({ url }) => {
  const paymentID = url.searchParams.get('paymentID') ?? '';
  const status = url.searchParams.get('status') ?? '';
  let location: string;
  try {
    location = await finishBkash(paymentID, status, url.origin);
  } catch (err) {
    console.error('bKash callback failed', err);
    location = `${url.origin}/digital-pack/confirmation/?status=pending`;
  }
  return new Response(null, { status: 303, headers: { location, 'cache-control': 'no-store' } });
};

export const ALL: APIRoute = () => new Response('method not allowed', { status: 405 });
