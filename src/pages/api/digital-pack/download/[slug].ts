import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import type { R2Bucket } from '@cloudflare/workers-types';
import { getMember, hasPlan, PLAN_DIGITAL_PACK } from '../../../../lib/members';
import { digitalPackReady } from '../../../../lib/sslcommerz';

export const prerender = false;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

/** A paid file can only be read through a live member entitlement. */
export const GET: APIRoute = async (ctx) => {
  const member = await getMember(ctx);
  if (!member) return json({ ok: false, error: 'signed-out' }, 401);
  if (!hasPlan(member, PLAN_DIGITAL_PACK)) return json({ ok: false, error: 'no-entitlement' }, 403);
  if (!digitalPackReady()) return json({ ok: false, error: 'not-ready' }, 503);

  const slug = ctx.params.slug ?? '';
  if (!/^[a-z0-9-]{2,48}$/.test(slug)) return json({ ok: false, error: 'file' }, 404);
  const bucket = (env as unknown as { PACK_FILES?: R2Bucket }).PACK_FILES;
  if (!bucket) return json({ ok: false, error: 'storage-unavailable' }, 503);

  const isBundle = slug === 'bundle';
  const guideSlugs = new Set(['start-here', '30-day-plan']);
  const key = isBundle ? 'digital-packs/posora-digital-pack-bundle.zip' : guideSlugs.has(slug) || /^[a-z0-9-]{2,48}$/.test(slug) ? `digital-packs/${slug}.pdf` : '';
  if (!key) return json({ ok: false, error: 'file' }, 404);
  const object = await bucket.get(key);
  if (!object) return json({ ok: false, error: 'file-not-found' }, 404);

  const filename = isBundle ? 'posora-digital-pack-bundle.zip' : `posora-${slug}.pdf`;
  const headers = new Headers();
  headers.set('content-type', isBundle ? 'application/zip' : 'application/pdf');
  headers.set('content-disposition', `attachment; filename="${filename}"`);
  headers.set('cache-control', 'private, no-store');
  headers.set('x-content-type-options', 'nosniff');
  if (object.httpEtag) headers.set('etag', object.httpEtag);
  return new Response(object.body as unknown as BodyInit, { headers });
};

export const ALL: APIRoute = () => json({ ok: false, error: 'method' }, 405);
