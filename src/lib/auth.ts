/**
 * Admin authentication: PBKDF2 password check + opaque session cookies.
 *
 * The password itself is never stored - only a PBKDF2-SHA256 hash, kept as the
 * `ADMIN_PASSWORD_HASH` Worker secret. Session ids are random 256-bit tokens;
 * D1 holds only their SHA-256, so a database dump cannot be replayed as a login.
 */
import type { APIContext } from 'astro';
import { dbEnv, requireDb } from './db';

export const COOKIE = 'posora_admin';
const SESSION_DAYS = 7;
const ITERATIONS = 210_000;
/** Lock an IP out after this many consecutive failures. */
const MAX_FAILS = 8;
const LOCK_MS = 15 * 60_000;

const enc = new TextEncoder();

const b64 = (b: ArrayBuffer | Uint8Array): string => {
  const bytes = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = '';
  for (const byte of bytes) s += String.fromCharCode(byte);
  return btoa(s);
};

const unb64 = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as unknown as BufferSource, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

/** Produce a `pbkdf2$<iterations>$<salt>$<hash>` string for ADMIN_PASSWORD_HASH. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(hash)}`;
}

/** Constant-time comparison, so a wrong password leaks no timing signal. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1000) return false;
  try {
    const actual = await pbkdf2(password, unb64(parts[2]!), iterations);
    return timingSafeEqual(actual, unb64(parts[3]!));
  } catch {
    return false;
  }
}

async function sha256Hex(s: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(s));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Create a session, returning the raw token to be set as a cookie. */
export async function createSession(ua: string | null): Promise<string> {
  const d = requireDb();
  const token = b64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const now = Date.now();
  await d
    .prepare('INSERT INTO sessions (id_hash, created_at, expires_at, ua) VALUES (?, ?, ?, ?)')
    .bind(await sha256Hex(token), now, now + SESSION_DAYS * 86_400_000, ua?.slice(0, 200) ?? null)
    .run();
  return token;
}

export async function destroySession(token: string): Promise<void> {
  const d = requireDb();
  await d.prepare('DELETE FROM sessions WHERE id_hash = ?').bind(await sha256Hex(token)).run();
}

/** True when the cookie names a live session. Expired rows are swept as they're hit. */
export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const d = requireDb();
  const hash = await sha256Hex(token);
  const row = await d.prepare('SELECT expires_at FROM sessions WHERE id_hash = ?').bind(hash).first<{ expires_at: number }>();
  if (!row) return false;
  if (row.expires_at < Date.now()) {
    await d.prepare('DELETE FROM sessions WHERE id_hash = ?').bind(hash).run();
    return false;
  }
  return true;
}

export const cookieOptions = (secure: boolean) =>
  ({ httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: SESSION_DAYS * 86_400 }) as const;

/** Whether this request is authenticated. Use at the top of every admin route. */
export async function isLoggedIn(ctx: APIContext): Promise<boolean> {
  if (!dbEnv().DB) return false;
  return isValidSession(ctx.cookies.get(COOKIE)?.value);
}

/**
 * Reject cross-origin writes. Combined with SameSite=Lax cookies this is
 * sufficient CSRF protection for same-origin form posts.
 */
export function sameOrigin(request: Request, url: URL): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Non-browser client or a same-origin GET.
  try {
    return new URL(origin).host === url.host;
  } catch {
    return false;
  }
}

export type Throttle = { blocked: boolean; retryInMs: number };

export async function checkThrottle(ip: string): Promise<Throttle> {
  const d = requireDb();
  const row = await d.prepare('SELECT fails, until FROM login_throttle WHERE ip = ?').bind(ip).first<{ fails: number; until: number }>();
  if (!row) return { blocked: false, retryInMs: 0 };
  const remaining = row.until - Date.now();
  return remaining > 0 ? { blocked: true, retryInMs: remaining } : { blocked: false, retryInMs: 0 };
}

export async function noteFailure(ip: string): Promise<void> {
  const d = requireDb();
  const row = await d.prepare('SELECT fails FROM login_throttle WHERE ip = ?').bind(ip).first<{ fails: number }>();
  const fails = (row?.fails ?? 0) + 1;
  const until = fails >= MAX_FAILS ? Date.now() + LOCK_MS : 0;
  await d
    .prepare(
      `INSERT INTO login_throttle (ip, fails, until) VALUES (?1, ?2, ?3)
       ON CONFLICT(ip) DO UPDATE SET fails = ?2, until = ?3`,
    )
    .bind(ip, fails, until)
    .run();
}

export async function clearFailures(ip: string): Promise<void> {
  const d = requireDb();
  await d.prepare('DELETE FROM login_throttle WHERE ip = ?').bind(ip).run();
}

export const clientIp = (request: Request): string =>
  request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
