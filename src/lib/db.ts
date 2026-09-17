/** D1 access for the admin panel and the runtime content layer. */
import { env } from 'cloudflare:workers';
import type { World } from '../data/worlds';

export type Status = 'draft' | 'published';
/** A world as the admin panel sees it: the public shape plus editorial state. */
export type AdminWorld = World & { status: Status; sort: number; updatedAt: number };

export type Env = {
  DB?: D1Database;
  ADMIN_PASSWORD_HASH?: string;
  SITE_URL?: string;
  /** Google sign-in. Set these and the panel's front door becomes Google. */
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  /** Comma separated. Only these Google accounts may enter the panel. */
  ADMIN_EMAILS?: string;
  /** SSLCommerz credentials are Worker secrets, never committed to source. */
  SSLCOMMERZ_STORE_ID?: string;
  SSLCOMMERZ_STORE_PASSWORD?: string;
  /** `sandbox` until the merchant account is approved for production. */
  SSLCOMMERZ_MODE?: 'sandbox' | 'live';
  /** Set to "true" only after the paid pack's downloadable files are live. */
  DIGITAL_PACK_READY?: string;
};

export const dbEnv = () => env as unknown as Env;

/** The D1 binding, or null when it isn't configured (local dev before setup). */
export function db(): D1Database | null {
  return dbEnv().DB ?? null;
}

/** Throwing variant for admin routes, which cannot work without D1. */
export function requireDb(): D1Database {
  const d = db();
  if (!d) throw new Error('D1 binding `DB` is not configured. See README > Admin setup.');
  return d;
}

const parse = <T>(raw: unknown, fallback: T): T => {
  if (typeof raw !== 'string') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

type WorldRow = {
  slug: string; bn: string; en: string; tag: string; hue: string;
  age: string; dep: string; phase: string; intro: string;
  keys_json: string; key_cats_json: string; cats_json: string;
  missions_json: string; mission_cats_json: string;
  open: number; status: string; sort: number; updated_at: number;
};

export function rowToWorld(r: WorldRow): AdminWorld {
  return {
    slug: r.slug, bn: r.bn, en: r.en, tag: r.tag, hue: r.hue,
    age: r.age, dep: r.dep, phase: r.phase, intro: r.intro,
    keys: parse<string[]>(r.keys_json, []),
    keyCats: parse<(number | null)[]>(r.key_cats_json, []),
    cats: parse<World['cats']>(r.cats_json, []),
    missions: parse<World['missions']>(r.missions_json, []),
    missionCats: parse<(number | null)[]>(r.mission_cats_json, []),
    open: r.open === 1,
    status: r.status === 'draft' ? 'draft' : 'published',
    sort: r.sort,
    updatedAt: r.updated_at,
  };
}

/** All worlds, ordered. `onlyPublished` is what the live site asks for. */
export async function selectWorlds(d: D1Database, onlyPublished: boolean): Promise<AdminWorld[]> {
  const sql = onlyPublished
    ? 'SELECT * FROM worlds WHERE status = ? ORDER BY sort, slug'
    : 'SELECT * FROM worlds ORDER BY sort, slug';
  const stmt = onlyPublished ? d.prepare(sql).bind('published') : d.prepare(sql);
  const { results } = await stmt.all<WorldRow>();
  return results.map(rowToWorld);
}

export async function selectWorld(d: D1Database, slug: string): Promise<AdminWorld | null> {
  const row = await d.prepare('SELECT * FROM worlds WHERE slug = ?').bind(slug).first<WorldRow>();
  return row ? rowToWorld(row) : null;
}

/** Insert or replace a world, preserving its row identity. */
export async function upsertWorld(d: D1Database, w: AdminWorld): Promise<void> {
  await d
    .prepare(
      `INSERT INTO worlds (slug, bn, en, tag, hue, age, dep, phase, intro,
         keys_json, key_cats_json, cats_json, missions_json, mission_cats_json,
         open, status, sort, updated_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18)
       ON CONFLICT(slug) DO UPDATE SET
         bn=?2, en=?3, tag=?4, hue=?5, age=?6, dep=?7, phase=?8, intro=?9,
         keys_json=?10, key_cats_json=?11, cats_json=?12, missions_json=?13,
         mission_cats_json=?14, open=?15, status=?16, sort=?17, updated_at=?18`,
    )
    .bind(
      w.slug, w.bn, w.en, w.tag, w.hue, w.age, w.dep, w.phase, w.intro,
      JSON.stringify(w.keys), JSON.stringify(w.keyCats), JSON.stringify(w.cats),
      JSON.stringify(w.missions), JSON.stringify(w.missionCats),
      w.open ? 1 : 0, w.status, w.sort, Date.now(),
    )
    .run();
}

export async function deleteWorld(d: D1Database, slug: string): Promise<void> {
  await d.prepare('DELETE FROM worlds WHERE slug = ?').bind(slug).run();
}

export async function setStatus(d: D1Database, slug: string, status: Status): Promise<void> {
  await d
    .prepare('UPDATE worlds SET status = ?, updated_at = ? WHERE slug = ?')
    .bind(status, Date.now(), slug)
    .run();
}

/** Named JSON documents: 'space' | 'math' | 'language' | 'heroes'. */
export async function getDataset<T>(d: D1Database, key: string): Promise<T | null> {
  const row = await d.prepare('SELECT json FROM datasets WHERE key = ?').bind(key).first<{ json: string }>();
  return row ? parse<T | null>(row.json, null) : null;
}

export async function putDataset(d: D1Database, key: string, value: unknown): Promise<void> {
  await d
    .prepare(
      `INSERT INTO datasets (key, json, updated_at) VALUES (?1, ?2, ?3)
       ON CONFLICT(key) DO UPDATE SET json = ?2, updated_at = ?3`,
    )
    .bind(key, JSON.stringify(value), Date.now())
    .run();
}

export async function audit(d: D1Database, action: string, target?: string, detail?: string): Promise<void> {
  await d
    .prepare('INSERT INTO audit (at, action, target, detail) VALUES (?, ?, ?, ?)')
    .bind(Date.now(), action, target ?? null, detail ?? null)
    .run();
}

export type AuditRow = { id: number; at: number; action: string; target: string | null; detail: string | null };

export async function recentAudit(d: D1Database, limit = 30): Promise<AuditRow[]> {
  const { results } = await d.prepare('SELECT * FROM audit ORDER BY at DESC LIMIT ?').bind(limit).all<AuditRow>();
  return results;
}
