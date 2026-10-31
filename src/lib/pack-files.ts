/**
 * The paid file library as the server sees it.
 *
 * `npm run digital-packs` writes manifest.json beside the PDFs and both go to
 * the private R2 bucket under digital-packs/. The manifest is the whitelist:
 * a slug that is not in it cannot be downloaded, and the account and
 * confirmation pages list exactly what it lists, so adding a file never needs
 * a code change.
 */
import { env } from 'cloudflare:workers';
import type { R2Bucket } from '@cloudflare/workers-types';
import { digitalPacks } from '../data/digital-packs';

export type PackFile = { slug: string; file: string; title: string; kind: 'world' | 'guide' | 'extra'; pages?: number; bytes?: number };
export type Library = { files: PackFile[]; bundleBytes?: number; totalPages?: number };

export const BUNDLE_SLUG = 'bundle';
export const BUNDLE_KEY = 'digital-packs/posora-digital-pack-bundle.zip';

export const packBucket = (): R2Bucket | null => (env as unknown as { PACK_FILES?: R2Bucket }).PACK_FILES ?? null;

/** What the library held before manifest v3, so an older upload still works. */
const FALLBACK: PackFile[] = [
  { slug: 'start-here', file: 'start-here.pdf', title: 'শুরু করার গাইড', kind: 'guide' },
  { slug: '30-day-plan', file: '30-day-plan.pdf', title: '৩০ দিনের পরিকল্পনা', kind: 'guide' },
  ...digitalPacks.map((p): PackFile => ({ slug: p.slug, file: `${p.slug}.pdf`, title: p.title, kind: 'world' })),
];

let cache: { at: number; lib: Library } | null = null;

export async function library(): Promise<Library> {
  if (cache && Date.now() - cache.at < 300_000) return cache.lib;
  let lib: Library = { files: FALLBACK };
  try {
    const obj = await packBucket()?.get('digital-packs/manifest.json');
    if (obj) {
      const m = JSON.parse(await obj.text()) as { files?: PackFile[]; bundleBytes?: number };
      const files = (m.files ?? []).filter((f) => /^[a-z0-9-]{2,48}$/.test(f.slug) && /^[a-z0-9-]+\.pdf$/.test(f.file) && f.title);
      if (files.length) lib = { files, bundleBytes: m.bundleBytes, totalPages: files.reduce((n, f) => n + (f.pages ?? 0), 0) || undefined };
    }
  } catch (err) {
    console.error('pack manifest unreadable', err);
  }
  cache = { at: Date.now(), lib };
  return lib;
}

export const mb = (bytes?: number) => bytes ? `${(bytes / 1_048_576).toFixed(bytes < 10_485_760 ? 1 : 0)} MB` : '';
