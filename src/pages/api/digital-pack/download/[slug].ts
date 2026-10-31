import type { APIRoute } from 'astro';
import { getMember, hasPlan, PLAN_DIGITAL_PACK, PLAN_FAMILY } from '../../../../lib/members';
import { digitalPackReady, orderForKey } from '../../../../lib/shop';
import { library, packBucket, BUNDLE_KEY, BUNDLE_SLUG } from '../../../../lib/pack-files';

export const prerender = false;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

/**
 * A paid file opens for one of three things: the bundle bought on this
 * account, the family plan (which includes every download), or the download
 * key of a paid order (?order=&k=), so a buyer can download the moment bKash
 * or SSLCommerz confirms, without signing in first.
 */
export const GET: APIRoute = async (ctx) => {
  const order = ctx.url.searchParams.get('order') ?? '';
  const key = ctx.url.searchParams.get('k') ?? '';
  let allowed = false;
  if (order && key) allowed = !!(await orderForKey(order, key));
  if (!allowed) {
    const member = await getMember(ctx);
    if (!member && !order) return json({ ok: false, error: 'signed-out' }, 401);
    allowed = hasPlan(member, PLAN_DIGITAL_PACK) || hasPlan(member, PLAN_FAMILY);
    if (!allowed) return json({ ok: false, error: order ? 'link-expired' : 'no-entitlement' }, 403);
  }
  if (!digitalPackReady()) return json({ ok: false, error: 'not-ready' }, 503);

  const slug = ctx.params.slug ?? '';
  const bucket = packBucket();
  if (!bucket) return json({ ok: false, error: 'storage-unavailable' }, 503);
  const isBundle = slug === BUNDLE_SLUG;
  const entry = isBundle ? null : (await library()).files.find((f) => f.slug === slug);
  if (!isBundle && !entry) return json({ ok: false, error: 'file' }, 404);
  const object = await bucket.get(isBundle ? BUNDLE_KEY : `digital-packs/${entry!.file}`);
  if (!object) return json({ ok: false, error: 'file-not-found' }, 404);

  const filename = isBundle ? 'posora-sob-download.zip' : `posora-${entry!.file}`;
  const headers = new Headers();
  headers.set('content-type', isBundle ? 'application/zip' : 'application/pdf');
  // Phones open a PDF in their viewer; `attachment` makes them save it instead.
  headers.set('content-disposition', `attachment; filename="${filename}"`);
  headers.set('content-length', String(object.size));
  headers.set('cache-control', 'private, no-store');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-robots-tag', 'noindex');
  if (object.httpEtag) headers.set('etag', object.httpEtag);
  return new Response(object.body as unknown as BodyInit, { headers });
};

export const ALL: APIRoute = () => json({ ok: false, error: 'method' }, 405);
