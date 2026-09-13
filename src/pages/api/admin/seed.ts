/**
 * Load the checked-in TypeScript content into D1.
 *
 * Idempotent and non-destructive by default: worlds that already exist in D1 are
 * left alone, so re-running never overwrites edits. Pass `force=1` to reset a
 * world back to its file contents.
 */
import type { APIRoute } from 'astro';
import { isLoggedIn, sameOrigin } from '../../../lib/auth';
import { audit, requireDb, selectWorld, upsertWorld, putDataset, getDataset, type AdminWorld } from '../../../lib/db';
import { bustCache } from '../../../lib/content';
import { worlds as staticWorlds } from '../../../data/worlds';
import { bodies } from '../../../data/space';
import { tools, numberWords, denominations, shopItems } from '../../../data/math';
import { vowels, consonants, kars, folas, conjuncts } from '../../../data/language';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const { request, url } = ctx;
  if (!sameOrigin(request, url)) return new Response('forbidden', { status: 403 });
  if (!(await isLoggedIn(ctx))) return new Response('unauthorized', { status: 401 });

  const d = requireDb();
  const force = new URL(request.url).searchParams.get('force') === '1';

  let created = 0;
  let skipped = 0;
  for (const [i, w] of staticWorlds.entries()) {
    if (!force && (await selectWorld(d, w.slug))) {
      skipped++;
      continue;
    }
    const row: AdminWorld = { ...w, status: 'published', sort: i, updatedAt: Date.now() };
    await upsertWorld(d, row);
    created++;
  }

  const datasets: Record<string, unknown> = {
    space: bodies,
    math: { tools, numberWords, denominations, shopItems },
    language: { vowels, consonants, kars, folas, conjuncts },
  };
  let datasetsWritten = 0;
  for (const [key, value] of Object.entries(datasets)) {
    if (!force && (await getDataset(d, key)) !== null) continue;
    await putDataset(d, key, value);
    datasetsWritten++;
  }

  await audit(d, force ? 'seed.force' : 'seed', undefined, `worlds:${created} skipped:${skipped} datasets:${datasetsWritten}`);
  bustCache();

  return new Response(JSON.stringify({ ok: true, created, skipped, datasets: datasetsWritten }), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
