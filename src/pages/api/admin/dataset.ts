/** Save one JSON document (space / math / language / heroes). */
import type { APIRoute } from 'astro';
import { isLoggedIn, sameOrigin } from '../../../lib/auth';
import { audit, putDataset, requireDb } from '../../../lib/db';
import { bustCache, isDatasetKey } from '../../../lib/content';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export const POST: APIRoute = async (ctx) => {
  const { request, url } = ctx;
  if (!sameOrigin(request, url)) return json({ ok: false, error: 'forbidden' }, 403);
  if (!(await isLoggedIn(ctx))) return json({ ok: false, error: 'unauthorized' }, 401);

  let body: { key?: unknown; json?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, error: 'bad-json' }, 400);
  }

  const key = String(body.key ?? '');
  if (!isDatasetKey(key)) return json({ ok: false, error: 'unknown dataset' }, 404);

  // The editor sends raw text; it must parse before we store it.
  let value: unknown;
  try {
    value = JSON.parse(String(body.json ?? ''));
  } catch (e) {
    return json({ ok: false, error: `JSON পার্স হয়নি: ${(e as Error).message}` }, 422);
  }

  const d = requireDb();
  await putDataset(d, key, value);
  await audit(d, 'dataset.save', key, `${JSON.stringify(value).length} bytes`);
  bustCache();

  return json({ ok: true, key });
};
