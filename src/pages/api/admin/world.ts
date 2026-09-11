/** Save, create and delete worlds. JSON in, JSON out - called by the editor. */
import type { APIRoute } from 'astro';
import { isLoggedIn, sameOrigin } from '../../../lib/auth';
import { audit, deleteWorld, requireDb, selectWorld, upsertWorld, type AdminWorld, type Status } from '../../../lib/db';
import { bustCache } from '../../../lib/content';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const str = (v: unknown, max: number): string => String(v ?? '').trim().slice(0, max);

/** Coerce whatever the form sent into a valid World, or explain what's wrong. */
function parseWorld(body: Record<string, unknown>): { world: AdminWorld } | { error: string } {
  const slug = str(body.slug, 40).toLowerCase();
  if (!/^[a-z0-9-]{2,40}$/.test(slug)) return { error: 'slug must be 2-40 chars of a-z, 0-9 or -' };

  const bn = str(body.bn, 80);
  if (!bn) return { error: 'বাংলা নাম দরকার' };

  const hue = str(body.hue, 9);
  if (!/^#[0-9a-fA-F]{6}$/.test(hue)) return { error: 'hue must be a #rrggbb colour' };

  const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

  const cats = asArray(body.cats)
    .map((c) => {
      const o = (c ?? {}) as Record<string, unknown>;
      return {
        n: str(o.n, 80),
        items: asArray(o.items).map((i) => str(i, 80)).filter(Boolean),
        play: str(o.play, 600),
      };
    })
    .filter((c) => c.n);

  const missions = asArray(body.missions)
    .map((m) => {
      const o = (m ?? {}) as Record<string, unknown>;
      return { n: str(o.n, 80), d: str(o.d, 300) };
    })
    .filter((m) => m.n);

  const keys = asArray(body.keys).map((k) => str(k, 80)).filter(Boolean);

  // A category index is valid only if it points at a category that exists.
  const catRef = (v: unknown): number | null => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isInteger(n) && n >= 0 && n < cats.length ? n : null;
  };
  const keyCats = keys.map((_, i) => catRef(asArray(body.keyCats)[i]));
  const missionCats = missions.map((_, i) => catRef(asArray(body.missionCats)[i]));

  const status: Status = body.status === 'draft' ? 'draft' : 'published';
  const sortRaw = Number(body.sort);

  return {
    world: {
      slug, bn,
      en: str(body.en, 80),
      tag: str(body.tag, 160),
      hue,
      age: str(body.age, 20),
      dep: str(body.dep, 80),
      phase: str(body.phase, 40),
      intro: str(body.intro, 4000),
      keys, keyCats, cats, missions, missionCats,
      open: body.open === true || body.open === 'true',
      status,
      sort: Number.isFinite(sortRaw) ? Math.trunc(sortRaw) : 0,
      updatedAt: Date.now(),
    },
  };
}

export const POST: APIRoute = async (ctx) => {
  const { request, url } = ctx;
  if (!sameOrigin(request, url)) return json({ ok: false, error: 'forbidden' }, 403);
  if (!(await isLoggedIn(ctx))) return json({ ok: false, error: 'unauthorized' }, 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'bad-json' }, 400);
  }

  const parsed = parseWorld(body);
  if ('error' in parsed) return json({ ok: false, error: parsed.error }, 422);

  const d = requireDb();
  const existing = await selectWorld(d, parsed.world.slug);
  // Creating a world must not silently overwrite another one.
  if (!existing && body.create !== true) return json({ ok: false, error: 'not-found' }, 404);
  if (existing && body.create === true) return json({ ok: false, error: 'slug already exists' }, 409);

  await upsertWorld(d, parsed.world);
  await audit(d, existing ? 'world.save' : 'world.create', parsed.world.slug, `${parsed.world.cats.length} cats`);
  bustCache();

  return json({ ok: true, slug: parsed.world.slug, updatedAt: parsed.world.updatedAt });
};

export const DELETE: APIRoute = async (ctx) => {
  const { request, url } = ctx;
  if (!sameOrigin(request, url)) return json({ ok: false, error: 'forbidden' }, 403);
  if (!(await isLoggedIn(ctx))) return json({ ok: false, error: 'unauthorized' }, 401);

  const slug = url.searchParams.get('slug') ?? '';
  const d = requireDb();
  if (!(await selectWorld(d, slug))) return json({ ok: false, error: 'not-found' }, 404);

  await deleteWorld(d, slug);
  await audit(d, 'world.delete', slug);
  bustCache();
  return json({ ok: true });
};
