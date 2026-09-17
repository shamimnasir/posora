import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import type { R2Bucket } from '@cloudflare/workers-types';
import { db } from '../../lib/db';
import { configured, digitalPackReady } from '../../lib/sslcommerz';

export const prerender = false;

/** Small, non-sensitive probe for uptime monitors and release checks. */
export const GET: APIRoute = () => {
  const storage = Boolean((env as unknown as { PACK_FILES?: R2Bucket }).PACK_FILES);
  const body = { ok: true, db: Boolean(db()), storage, checkoutConfigured: configured(), digitalPackReady: digitalPackReady() };
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
};

export const ALL: APIRoute = () => new Response(JSON.stringify({ ok: false, error: 'method' }), { status: 405, headers: { 'content-type': 'application/json; charset=utf-8' } });
