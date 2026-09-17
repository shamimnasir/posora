/**
 * পসরা পরিবার - member accounts.
 *
 * Only an adult has an account. There are two ways into one: a password, or a
 * six digit code emailed on request. The code came first and stays, because it
 * is also how a new address is proved and how somebody who has forgotten a
 * password gets back in - so there is no separate reset flow to build wrong.
 * Children are a nickname and a reading level under the member, nothing more.
 * Entitlements are rows granted from the admin panel until a payment rail
 * exists.
 *
 * Every function that needs the database throws when D1 is missing, the same
 * as the admin code, so a misconfigured deployment fails loudly rather than
 * pretending to sign people in.
 */
import type { APIContext } from 'astro';
import { env } from 'cloudflare:workers';
import { requireDb, db } from './db';
import { passMark } from './quiz';
import { bn } from './bn';
import { hashPassword, verifyPassword } from './auth';

export const MEMBER_COOKIE = 'posora_member';
export const CHILD_COOKIE = 'posora_child';
const SESSION_DAYS = 30;
const LINK_MINUTES = 20;
/** Sign-in links per email or per IP inside one hour before we stop sending. */
const LINK_LIMIT = 5;
const LINK_WINDOW_MS = 60 * 60_000;
/**
 * Wrong codes allowed before the whole sign-in request is dead.
 *
 * Six digits is about twenty bits, which is only safe because this number is
 * small. Five requests an hour times this is a few dozen guesses against a
 * million, per hour, per address.
 */
const CODE_TRIES = 5;
export const MAX_CHILDREN = 6;
export const PLAN_FAMILY = 'family';
/** One-time products can use the same entitlement ledger as the family plan. */
export const PLAN_DIGITAL_PACK = 'digital-pack-bundle';

type MailEnv = {
  EMAIL?: { send(msg: { to: string; from: { email: string; name: string }; subject: string; text: string; html: string }): Promise<unknown> };
  CONTACT_FROM?: string;
};

export type Level = 'l1' | 'l2' | 'l3';
export type Child = { id: string; nickname: string; level: Level; sort: number; createdAt: number };
export type Entitlement = { id: number; plan: string; status: 'active' | 'ended'; startsAt: number; endsAt: number | null; note: string | null; grantedBy: string };
export type Member = {
  id: string;
  email: string;
  name: string | null;
  createdAt: number;
  lastLoginAt: number | null;
  /** Whether a password is set. The hash itself never leaves this file. */
  hasPassword: boolean;
  entitlements: Entitlement[];
  children: Child[];
};

const enc = new TextEncoder();

const b64url = (bytes: Uint8Array): string => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const randomToken = () => b64url(crypto.getRandomValues(new Uint8Array(32)));
/**
 * Six digits, drawn without modulo bias: the naive `% 1000000` over a 32-bit
 * value makes the low codes very slightly likelier, and for something this
 * short that is worth not doing.
 */
function randomCode(): string {
  const max = 1_000_000, limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  let n = 0;
  do { crypto.getRandomValues(buf); n = buf[0]!; } while (n >= limit);
  return String(n % max).padStart(6, '0');
}
/** The code is hashed with the address, so one rainbow table cannot cover every user. */
const codeHash = (code: string, email: string) => sha256Hex(`${email}:${code}`);
const newId = () => b64url(crypto.getRandomValues(new Uint8Array(12)));

async function sha256Hex(s: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(s));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const normalizeEmail = (raw: string): string => raw.trim().toLowerCase();
export const isEmail = (s: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 254;

export const cookieOptions = (secure: boolean) =>
  ({ httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: SESSION_DAYS * 86_400 }) as const;
/** The active-child cookie is read by the page server-side, so it is httpOnly too. */
export const childCookieOptions = (secure: boolean) =>
  ({ httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 365 * 86_400 }) as const;

/* ---------- throttle ---------- */

/**
 * Count this request and say whether the key is now over its limit.
 *
 * Every call counts, which is right for asking us to send an email: the cost
 * is the email itself, so a successful send is exactly what we are rationing.
 * It is wrong for a password form, where a parent signing in on the phone and
 * the laptop would spend the allowance on nothing. That path uses the pair
 * below instead.
 */
async function throttled(key: string, limit = LINK_LIMIT, windowMs = LINK_WINDOW_MS): Promise<boolean> {
  const d = requireDb();
  const now = Date.now();
  const row = await d.prepare('SELECT count, until FROM member_throttle WHERE key = ?').bind(key).first<{ count: number; until: number }>();
  if (!row || row.until < now) {
    await d.prepare('INSERT INTO member_throttle (key, count, until) VALUES (?1, 1, ?2) ON CONFLICT(key) DO UPDATE SET count = 1, until = ?2')
      .bind(key, now + windowMs).run();
    return false;
  }
  if (row.count >= limit) return true;
  await d.prepare('UPDATE member_throttle SET count = count + 1 WHERE key = ?').bind(key).run();
  return false;
}

/** Read the counter without touching it. */
async function atLimit(key: string, limit: number): Promise<boolean> {
  const row = await requireDb().prepare('SELECT count, until FROM member_throttle WHERE key = ?')
    .bind(key).first<{ count: number; until: number }>();
  return !!row && row.until >= Date.now() && row.count >= limit;
}

/** Record one failure against a key, starting a fresh window if none is open. */
async function noteFailure(key: string, windowMs: number): Promise<void> {
  const d = requireDb();
  const now = Date.now();
  await d.prepare(
    `INSERT INTO member_throttle (key, count, until) VALUES (?1, 1, ?2)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN member_throttle.until < ?3 THEN 1 ELSE member_throttle.count + 1 END,
       until = CASE WHEN member_throttle.until < ?3 THEN ?2 ELSE member_throttle.until END`,
  ).bind(key, now + windowMs, now).run();
}

/* ---------- sign in ---------- */

export type LinkResult = 'sent' | 'throttled' | 'email-unavailable';

/**
 * Email a one-time sign-in link. Always answers the same way to the caller
 * whether or not the address is known, so the form cannot be used to check
 * who is a member.
 */
export async function requestMagicLink(rawEmail: string, origin: string, ip: string): Promise<LinkResult> {
  const email = normalizeEmail(rawEmail);
  const d = requireDb();
  if (await throttled(`e:${await sha256Hex(email)}`) || await throttled(`ip:${ip}`)) return 'throttled';

  const mail = env as unknown as MailEnv;
  if (!mail.EMAIL) return 'email-unavailable';

  const token = randomToken();
  const code = randomCode();
  const now = Date.now();
  await d.prepare('INSERT INTO member_tokens (token_hash, email, created_at, expires_at, code_hash) VALUES (?, ?, ?, ?, ?)')
    .bind(await sha256Hex(token), email, now, now + LINK_MINUTES * 60_000, await codeHash(code, email)).run();

  const link = `${origin}/account/verify?t=${token}`;
  /**
   * The code comes first and the link second, deliberately. Typing six digits
   * into the tab that is already open is the path that works everywhere; the
   * link is the convenience, and on a phone it is the one more likely to go
   * wrong (see migrations/0004 for why).
   */
  const text = [
    `পসরায় ঢোকার কোড: ${code}`,
    '',
    `যে পাতায় ইমেইল লিখেছিলেন, সেখানেই এই ছয় সংখ্যা বসিয়ে দিন। ${bn(LINK_MINUTES)} মিনিট কাজ করবে।`,
    '',
    'অথবা এই লিংকে চাপুন:',
    link,
    '',
    'আপনি যদি এটা না চেয়ে থাকেন, কিছু করতে হবে না - কেউ আপনার অ্যাকাউন্টে ঢুকতে পারবে না।',
  ].join('\n');
  const html = `<!doctype html><html lang="bn"><body style="margin:0;background:#e9edf2;font-family:'Noto Sans Bengali',system-ui,sans-serif;line-height:1.7">
  <div style="max-width:520px;margin:0 auto;padding:24px 16px">
    <div style="background:#fcfdfe;border:1px solid #e3e9f0;border-radius:16px;padding:22px">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6b7987">পসরায় ঢোকার কোড</p>
      <p style="margin:0 0 14px;font-size:34px;font-weight:800;letter-spacing:.22em;color:#111820;font-family:ui-monospace,Menlo,monospace">${code}</p>
      <p style="margin:0 0 18px;font-size:15px;color:#3c4854">যে পাতায় ইমেইল লিখেছিলেন, সেখানেই এই ছয় সংখ্যা বসিয়ে দিন। ${bn(LINK_MINUTES)} মিনিট কাজ করবে।</p>
      <p style="margin:0 0 8px;font-size:13px;color:#6b7987">অথবা এই বোতামে চাপুন:</p>
      <p style="margin:0"><a href="${link}" style="display:inline-block;background:#15544c;color:#f4fbf9;text-decoration:none;padding:11px 20px;border-radius:999px;font-weight:700;font-size:15px">পসরায় ঢোকো</a></p>
    </div>
    <p style="margin:14px 0 0;font-size:12px;color:#6b7987">আপনি যদি এটা না চেয়ে থাকেন, কিছু করতে হবে না - কেউ আপনার অ্যাকাউন্টে ঢুকতে পারবে না।</p>
  </div>
</body></html>`;
  await mail.EMAIL.send({
    to: email,
    from: { email: mail.CONTACT_FROM ?? 'no-reply@posora.com', name: 'পসরা' },
    subject: `পসরায় ঢোকার কোড ${code}`,
    text,
    html,
  });
  return 'sent';
}

/**
 * Look at a link's token without spending it.
 *
 * This exists because mail gateways fetch every URL in a message to scan it.
 * If a GET signed you in, the scanner would spend the link before the person
 * ever clicked and they would be locked out with no explanation. So the page
 * behind the link only *looks*, shows who it is about, and a form POST does
 * the signing in. Scanners issue GETs, not same-origin form posts.
 */
export type LinkPeek = { ok: true; email: string } | { ok: false };
export async function peekMagicLink(token: string): Promise<LinkPeek> {
  if (!token || token.length < 20) return { ok: false };
  const row = await requireDb().prepare('SELECT email, expires_at, used_at FROM member_tokens WHERE token_hash = ?')
    .bind(await sha256Hex(token)).first<{ email: string; expires_at: number; used_at: number | null }>();
  if (!row || row.used_at || row.expires_at < Date.now()) return { ok: false };
  return { ok: true, email: row.email };
}

/** Start the session for an address, creating the member on first sign-in. */
async function startSession(email: string, ua: string | null): Promise<string> {
  const d = requireDb();
  const now = Date.now();
  let member = await d.prepare('SELECT id FROM members WHERE email = ?').bind(email).first<{ id: string }>();
  if (!member) {
    const id = newId();
    await d.prepare('INSERT INTO members (id, email, created_at, last_login_at) VALUES (?, ?, ?, ?)').bind(id, email, now, now).run();
    member = { id };
  } else {
    await d.prepare('UPDATE members SET last_login_at = ? WHERE id = ?').bind(now, member.id).run();
  }
  const session = randomToken();
  await d.prepare('INSERT INTO member_sessions (id_hash, member_id, created_at, expires_at, ua) VALUES (?, ?, ?, ?, ?)')
    .bind(await sha256Hex(session), member.id, now, now + SESSION_DAYS * 86_400_000, ua?.slice(0, 200) ?? null).run();
  return session;
}

/** Spend a link's token. Returns the raw session token, or null. */
export async function consumeMagicLink(token: string, ua: string | null): Promise<string | null> {
  if (!token || token.length < 20) return null;
  const d = requireDb();
  const hash = await sha256Hex(token);
  const row = await d.prepare('SELECT email, expires_at, used_at FROM member_tokens WHERE token_hash = ?')
    .bind(hash).first<{ email: string; expires_at: number; used_at: number | null }>();
  const now = Date.now();
  if (!row || row.used_at || row.expires_at < now) return null;
  await d.prepare('UPDATE member_tokens SET used_at = ? WHERE token_hash = ?').bind(now, hash).run();
  await d.prepare('UPDATE members SET email_verified = 1 WHERE email = ?').bind(row.email).run();
  return startSession(row.email, ua);
}

export type CodeResult =
  | { ok: true; session: string }
  | { ok: false; error: 'bad' | 'expired' | 'locked' };

/**
 * Spend a typed code. Scoped to the address, because six digits on their own
 * are trivially enumerable, and counted, because six digits are only about
 * twenty bits: after CODE_TRIES wrong guesses the whole request is dead and
 * the parent has to ask for a new one.
 */
export async function consumeCode(rawEmail: string, rawCode: string, ua: string | null): Promise<CodeResult> {
  const email = normalizeEmail(rawEmail);
  const code = rawCode.replace(/\D/g, '');
  if (!isEmail(email) || code.length !== 6) return { ok: false, error: 'bad' };
  const d = requireDb();
  const now = Date.now();

  // The newest live request for this address is the one being answered.
  const row = await d.prepare(
    `SELECT token_hash, code_hash, expires_at, used_at, attempts FROM member_tokens
     WHERE email = ? AND code_hash IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
  ).bind(email).first<{ token_hash: string; code_hash: string; expires_at: number; used_at: number | null; attempts: number }>();
  if (!row || row.used_at || row.expires_at < now) return { ok: false, error: 'expired' };
  if (row.attempts >= CODE_TRIES) return { ok: false, error: 'locked' };

  if (row.code_hash !== (await codeHash(code, email))) {
    await d.prepare('UPDATE member_tokens SET attempts = attempts + 1 WHERE token_hash = ?').bind(row.token_hash).run();
    return { ok: false, error: row.attempts + 1 >= CODE_TRIES ? 'locked' : 'bad' };
  }
  // One request, one sign-in: spending the code also kills the link in the
  // same email, so a scanner cannot follow it afterwards either.
  await d.prepare('UPDATE member_tokens SET used_at = ? WHERE token_hash = ?').bind(now, row.token_hash).run();
  // entering the code is the proof that this address is theirs, which is what
  // a password account is waiting for before it will let anybody in
  await d.prepare('UPDATE members SET email_verified = 1 WHERE email = ?').bind(email).run();
  return { ok: true, session: await startSession(email, ua) };
}

/* ---------- email and password ---------- */

/**
 * Passwords for members, next to the emailed code rather than instead of it.
 *
 * Two rules do most of the work here. A password account is inert until the
 * emailed code has proved the address, because otherwise anyone could register
 * with an address that is not theirs, set a password, and be sitting inside
 * the account when its real owner signs in. And there is no separate reset
 * flow: the code that already exists *is* the way back in, so there is no
 * second secret-bearing email to get wrong.
 *
 * The hashing is `lib/auth.ts`, the same PBKDF2-SHA256 the admin password
 * uses. One implementation, one iteration count, one place to raise it.
 */
export const MIN_PASSWORD = 10;

export type RegisterResult =
  | { ok: true; needsCode: true }
  | { ok: false; error: 'bad-email' | 'weak' | 'taken' | 'throttled' | 'email-unavailable' };

/**
 * Create an unverified account carrying a password, then send the code that
 * proves the address. Answers 'taken' only for an account that is already
 * verified: an unverified row is not evidence anybody owns the address, and
 * letting a second attempt overwrite it means a typo does not lock the real
 * owner out forever.
 */
export async function registerWithPassword(
  rawEmail: string, password: string, rawName: string, origin: string, ip: string,
): Promise<RegisterResult> {
  const email = normalizeEmail(rawEmail);
  if (!isEmail(email)) return { ok: false, error: 'bad-email' };
  if (password.length < MIN_PASSWORD) return { ok: false, error: 'weak' };

  const d = requireDb();
  const existing = await d.prepare('SELECT id, email_verified FROM members WHERE email = ?')
    .bind(email).first<{ id: string; email_verified: number }>();
  if (existing?.email_verified) return { ok: false, error: 'taken' };

  const hash = await hashPassword(password);
  const name = rawName.trim().slice(0, 80) || null;
  const now = Date.now();
  if (existing) {
    await d.prepare('UPDATE members SET password_hash = ?, name = COALESCE(?, name) WHERE id = ?')
      .bind(hash, name, existing.id).run();
  } else {
    await d.prepare('INSERT INTO members (id, email, name, created_at, password_hash, email_verified) VALUES (?, ?, ?, ?, ?, 0)')
      .bind(newId(), email, name, now, hash).run();
  }

  const sent = await requestMagicLink(email, origin, ip);
  if (sent === 'sent') return { ok: true, needsCode: true };
  return { ok: false, error: sent === 'throttled' ? 'throttled' : 'email-unavailable' };
}

export type PasswordResult =
  | { ok: true; session: string }
  | { ok: false; error: 'bad' | 'unverified' | 'throttled' };

/**
 * Only wrong answers count here, and the two keys are counted very
 * differently. An address is one person, so ten misses in a quarter of an hour
 * is already far more than someone reaching for a forgotten password. An IP is
 * often a whole country: Bangladeshi mobile networks put enormous numbers of
 * people behind a handful of addresses, so a tight per-IP limit does not stop
 * an attacker with a botnet, it shuts out a city. It is set wide enough to be
 * a backstop against one machine hammering many addresses, nothing more.
 */
const PW_WINDOW_MS = 15 * 60_000;
const PW_TRIES = 10;
const PW_IP_TRIES = 100;

/**
 * A real hash of a password nobody has, so that checking an address with no
 * account takes the same time as checking one that has it. The value is a
 * constant on purpose: it never matches, and it is never stored.
 */
const DECOY_HASH = 'pbkdf2$210000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

/**
 * Sign in with a password. A wrong address and a wrong password answer
 * identically, so the form cannot be used to find out who has an account.
 */
export async function signInWithPassword(
  rawEmail: string, password: string, ua: string | null, ip: string,
): Promise<PasswordResult> {
  const email = normalizeEmail(rawEmail);
  if (!isEmail(email) || !password) return { ok: false, error: 'bad' };
  const byEmail = `pw:${await sha256Hex(email)}`, byIp = `pwip:${ip}`;
  if (await atLimit(byEmail, PW_TRIES) || await atLimit(byIp, PW_IP_TRIES)) {
    return { ok: false, error: 'throttled' };
  }

  const d = requireDb();
  const row = await d.prepare('SELECT id, password_hash, email_verified FROM members WHERE email = ?')
    .bind(email).first<{ id: string; password_hash: string | null; email_verified: number }>();
  // An unknown address must cost the same hundred milliseconds as a known one.
  // Skipping the hash when there is no row would let anyone time the form and
  // read off who is a member, which is exactly what the identical wording of
  // the two answers is there to prevent.
  const wrong = !(await verifyPassword(password, row?.password_hash ?? DECOY_HASH));
  if (wrong) {
    await noteFailure(byEmail, PW_WINDOW_MS);
    await noteFailure(byIp, PW_WINDOW_MS);
    return { ok: false, error: 'bad' };
  }
  // Right password, wrong state: the address has never been proved. Not a
  // failed attempt, so it does not count against either key.
  if (!row!.email_verified) return { ok: false, error: 'unverified' };

  return { ok: true, session: await startSession(email, ua) };
}

/** Set or change the password of the member who is already signed in. */
export type SetPasswordResult = 'ok' | 'weak' | 'wrong' | 'not-found';

/**
 * Set or change the password of the member who is already signed in.
 *
 * Someone who already has a password has to type it. A live session on a
 * borrowed or forgotten laptop should not be enough to take an account away
 * from its owner, and a person who genuinely cannot remember theirs still has
 * the emailed code, which is the way back in and always was.
 *
 * Changing it ends every other session, because the reason to change a
 * password is usually that somebody else might have had it.
 */
export async function setMemberPassword(
  memberId: string, password: string, current: string, keepToken: string | undefined,
): Promise<SetPasswordResult> {
  if (password.length < MIN_PASSWORD) return 'weak';
  const d = requireDb();
  const row = await d.prepare('SELECT password_hash FROM members WHERE id = ?')
    .bind(memberId).first<{ password_hash: string | null }>();
  if (!row) return 'not-found';
  if (row.password_hash && !(await verifyPassword(current, row.password_hash))) return 'wrong';

  await d.prepare('UPDATE members SET password_hash = ? WHERE id = ?')
    .bind(await hashPassword(password), memberId).run();
  if (keepToken) {
    await d.prepare('DELETE FROM member_sessions WHERE member_id = ? AND id_hash != ?')
      .bind(memberId, await sha256Hex(keepToken)).run();
  }
  return 'ok';
}

export async function destroyMemberSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await requireDb().prepare('DELETE FROM member_sessions WHERE id_hash = ?').bind(await sha256Hex(token)).run();
}

/* ---------- reading a member ---------- */

async function loadMember(d: D1Database, id: string): Promise<Member | null> {
  const m = await d.prepare('SELECT id, email, name, created_at, last_login_at, password_hash IS NOT NULL AS has_pw FROM members WHERE id = ?').bind(id)
    .first<{ id: string; email: string; name: string | null; created_at: number; last_login_at: number | null; has_pw: number }>();
  if (!m) return null;
  const { results: ents } = await d.prepare('SELECT id, plan, status, starts_at, ends_at, note, granted_by FROM entitlements WHERE member_id = ? ORDER BY created_at DESC')
    .bind(id).all<{ id: number; plan: string; status: 'active' | 'ended'; starts_at: number; ends_at: number | null; note: string | null; granted_by: string }>();
  const { results: kids } = await d.prepare('SELECT id, nickname, level, sort, created_at FROM children WHERE member_id = ? ORDER BY sort, created_at')
    .bind(id).all<{ id: string; nickname: string; level: Level; sort: number; created_at: number }>();
  return {
    id: m.id, email: m.email, name: m.name, createdAt: m.created_at, lastLoginAt: m.last_login_at,
    hasPassword: m.has_pw === 1,
    entitlements: ents.map((e) => ({ id: e.id, plan: e.plan, status: e.status, startsAt: e.starts_at, endsAt: e.ends_at, note: e.note, grantedBy: e.granted_by })),
    children: kids.map((k) => ({ id: k.id, nickname: k.nickname, level: k.level, sort: k.sort, createdAt: k.created_at })),
  };
}

/**
 * The signed-in member for this request, or null. Safe to call when D1 is
 * absent - and, like `content.ts`'s `loadAllWorlds`, safe to call when D1 is
 * present but the query itself fails.
 *
 * Every world page reads this, so a member whose session lookup throws - a
 * mid-migration schema mismatch, a transient D1 error, anything - cannot be
 * allowed to take the page down for them. The failure mode has to be "treated
 * as a visitor who isn't signed in", the same as a missing cookie, not a
 * broken page. content.ts's own comment says it best: an outage must never
 * take the public site down.
 */
export async function getMember(ctx: APIContext): Promise<Member | null> {
  const d = db();
  const token = ctx.cookies.get(MEMBER_COOKIE)?.value;
  if (!d || !token) return null;
  try {
    const hash = await sha256Hex(token);
    const row = await d.prepare('SELECT member_id, expires_at FROM member_sessions WHERE id_hash = ?').bind(hash).first<{ member_id: string; expires_at: number }>();
    if (!row) return null;
    if (row.expires_at < Date.now()) {
      await d.prepare('DELETE FROM member_sessions WHERE id_hash = ?').bind(hash).run();
      return null;
    }
    return await loadMember(d, row.member_id);
  } catch {
    return null;
  }
}

/** True when the member holds a live entitlement to the plan right now. */
export function hasPlan(member: Member | null, plan = PLAN_FAMILY): boolean {
  if (!member) return false;
  const now = Date.now();
  return member.entitlements.some((e) => e.plan === plan && e.status === 'active' && e.startsAt <= now && (e.endsAt === null || e.endsAt > now));
}

/** The child the family is currently using on this device, if it belongs to this member. */
export function activeChild(ctx: APIContext, member: Member | null): Child | null {
  if (!member) return null;
  const id = ctx.cookies.get(CHILD_COOKIE)?.value;
  return member.children.find((c) => c.id === id) ?? member.children[0] ?? null;
}

/* ---------- children ---------- */

export async function addChild(memberId: string, nickname: string, level: Level): Promise<Child | 'full' | 'invalid'> {
  const nick = nickname.trim().slice(0, 40);
  if (nick.length < 1) return 'invalid';
  const d = requireDb();
  const count = await d.prepare('SELECT COUNT(*) AS n FROM children WHERE member_id = ?').bind(memberId).first<{ n: number }>();
  if ((count?.n ?? 0) >= MAX_CHILDREN) return 'full';
  const id = newId(), now = Date.now();
  await d.prepare('INSERT INTO children (id, member_id, nickname, level, sort, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, memberId, nick, level, count?.n ?? 0, now).run();
  return { id, nickname: nick, level, sort: count?.n ?? 0, createdAt: now };
}

export async function updateChild(memberId: string, childId: string, nickname: string, level: Level): Promise<boolean> {
  const nick = nickname.trim().slice(0, 40);
  if (nick.length < 1) return false;
  const r = await requireDb().prepare('UPDATE children SET nickname = ?, level = ? WHERE id = ? AND member_id = ?')
    .bind(nick, level, childId, memberId).run();
  return Number(r.meta.changes ?? 0) > 0;
}

export async function removeChild(memberId: string, childId: string): Promise<boolean> {
  const d = requireDb();
  const r = await d.prepare('DELETE FROM children WHERE id = ? AND member_id = ?').bind(childId, memberId).run();
  if (Number(r.meta.changes ?? 0) === 0) return false;
  await d.prepare('DELETE FROM child_progress WHERE child_id = ?').bind(childId).run();
  await d.prepare('DELETE FROM quiz_results WHERE child_id = ?').bind(childId).run();
  return true;
}

/* ---------- progress ---------- */

export async function getChildProgress(childId: string, world: string): Promise<string[]> {
  const { results } = await requireDb().prepare('SELECT item_key FROM child_progress WHERE child_id = ? AND world = ?')
    .bind(childId, world).all<{ item_key: string }>();
  return results.map((r) => r.item_key);
}

/** Union in a device's keys. Idempotent; returns how many were new. */
export async function mergeChildProgress(childId: string, world: string, keys: string[]): Promise<number> {
  const d = requireDb();
  const now = Date.now();
  const clean = [...new Set(keys.map((k) => String(k).slice(0, 200)).filter(Boolean))].slice(0, 500);
  if (clean.length === 0) return 0;
  const stmts = clean.map((k) =>
    d.prepare('INSERT OR IGNORE INTO child_progress (child_id, world, item_key, seen_at) VALUES (?, ?, ?, ?)').bind(childId, world, k, now),
  );
  const res = await d.batch(stmts);
  return res.reduce((n, r) => n + Number(r.meta.changes ?? 0), 0);
}

export async function progressSummary(childId: string): Promise<Record<string, number>> {
  const { results } = await requireDb().prepare('SELECT world, COUNT(*) AS n FROM child_progress WHERE child_id = ? GROUP BY world')
    .bind(childId).all<{ world: string; n: number }>();
  return Object.fromEntries(results.map((r) => [r.world, r.n]));
}

/* ---------- quizzes ---------- */

export type QuizResult = { world: string; cat: number; score: number; total: number; at: number };

export async function saveQuizResult(childId: string, world: string, cat: number, score: number, total: number): Promise<void> {
  await requireDb().prepare('INSERT INTO quiz_results (child_id, world, cat, score, total, at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(childId, world, cat, score, total, Date.now()).run();
}

/** Best result per category for a child, newest first within ties. */
export async function bestQuizResults(childId: string, world?: string): Promise<QuizResult[]> {
  const d = requireDb();
  const stmt = world
    ? d.prepare('SELECT world, cat, MAX(score) AS score, total, MAX(at) AS at FROM quiz_results WHERE child_id = ? AND world = ? GROUP BY world, cat').bind(childId, world)
    : d.prepare('SELECT world, cat, MAX(score) AS score, total, MAX(at) AS at FROM quiz_results WHERE child_id = ? GROUP BY world, cat').bind(childId);
  const { results } = await stmt.all<QuizResult>();
  return results;
}

/* ---------- the family week ---------- */

/** Asia/Dhaka is UTC+6 with no daylight saving, so one constant is the whole rule. */
const DHAKA_MS = 6 * 3600_000;

export type WeekRow = {
  childId: string;
  nickname: string;
  /** Items opened in the window. */
  items: number;
  /** Days in the window on which anything was opened at all. */
  days: number;
  /** Quizzes taken in the window, and how many of those were passed. */
  quizzes: number;
  passed: number;
  /** Worlds touched in the window, newest first, for the parent's sentence. */
  worlds: string[];
  /** Last time anything happened, or 0. */
  last: number;
};

/**
 * What each child on one plan did in the last `days` days.
 *
 * Two jobs, one query set. It is the family board the children see, which is
 * the only leaderboard this site will ever have: siblings on one account, no
 * strangers, no extra data about anybody. And it is the body of the weekly
 * email to the adult, which is the only way this site can reach a household,
 * since a website cannot notify a child and must not try.
 *
 * Everything here is counted from rows the child's own devices already wrote.
 * Nothing new is collected to make it.
 */
/**
 * This week in one world, per child.
 *
 * `familyWeek` sums across every world, which is right for a parent's summary
 * and useless on a world page. Siblings on one plan and nobody else, same as
 * everywhere: this adds no stranger and no new data, it only asks a narrower
 * question of rows the children's own devices already wrote.
 */
export type WorldWeekRow = { childId: string; nickname: string; items: number; last: number };
export async function familyWeekIn(kids: Child[], world: string, days = 7): Promise<WorldWeekRow[]> {
  if (!kids.length) return [];
  const d = db();
  if (!d) return [];
  const since = Date.now() - days * 86400000;
  const ids = kids.map((k) => k.id);
  const marks = ids.map(() => '?').join(', ');
  try {
    const rows = await d.prepare(
      `SELECT child_id, COUNT(*) AS n, MAX(seen_at) AS last
       FROM child_progress WHERE child_id IN (${marks}) AND world = ? AND seen_at >= ?
       GROUP BY child_id`,
    ).bind(...ids, world, since).all<{ child_id: string; n: number; last: number }>();
    return kids.map((k) => {
      const r = rows.results.find((x) => x.child_id === k.id);
      return { childId: k.id, nickname: k.nickname, items: r?.n ?? 0, last: r?.last ?? 0 };
    });
  } catch {
    // A world page must never fail over a sibling count.
    return [];
  }
}

export async function familyWeek(kids: Child[], days = 7): Promise<WeekRow[]> {
  if (!kids.length) return [];
  const d = requireDb();
  const since = Date.now() - days * 86400000;
  const ids = kids.map((k) => k.id);
  const marks = ids.map(() => '?').join(', ');

  const prog = await d.prepare(
    `SELECT child_id, world, COUNT(*) AS n, MAX(seen_at) AS last
     FROM child_progress WHERE child_id IN (${marks}) AND seen_at >= ?
     GROUP BY child_id, world`,
  ).bind(...ids, since).all<{ child_id: string; world: string; n: number; last: number }>();

  // Days have to be counted across every world at once, or a child who opened
  // two worlds on one evening reads as two separate days. DHAKA_MS shifts the
  // bucket boundary off UTC midnight and onto Bangladesh's, so a session at
  // half past midnight belongs to the evening it actually was.
  const dayRows = await d.prepare(
    `SELECT child_id, COUNT(DISTINCT CAST((seen_at + ${DHAKA_MS}) / 86400000 AS INTEGER)) AS days
     FROM child_progress WHERE child_id IN (${marks}) AND seen_at >= ?
     GROUP BY child_id`,
  ).bind(...ids, since).all<{ child_id: string; days: number }>();

  const quiz = await d.prepare(
    `SELECT child_id, score, total, at FROM quiz_results
     WHERE child_id IN (${marks}) AND at >= ?`,
  ).bind(...ids, since).all<{ child_id: string; score: number; total: number; at: number }>();

  return kids.map((k) => {
    const rows = prog.results.filter((r) => r.child_id === k.id);
    const qs = quiz.results.filter((r) => r.child_id === k.id);
    return {
      childId: k.id,
      nickname: k.nickname,
      items: rows.reduce((n, r) => n + r.n, 0),
      days: dayRows.results.find((r) => r.child_id === k.id)?.days ?? 0,
      quizzes: qs.length,
      passed: qs.filter((q) => q.score >= passMark(q.total)).length,
      worlds: rows.sort((a, b) => b.last - a.last).map((r) => r.world),
      last: Math.max(0, ...rows.map((r) => r.last), ...qs.map((q) => q.at)),
    };
  });
}

/** The children on a plan, in their display order. For callers with no session. */
export async function listChildren(memberId: string): Promise<Child[]> {
  const { results } = await requireDb()
    .prepare('SELECT id, nickname, level, sort, created_at AS createdAt FROM children WHERE member_id = ? ORDER BY sort, created_at')
    .bind(memberId).all<Child>();
  return results;
}

/* ---------- waitlist ---------- */

export async function addWaitlist(topic: string, name: string, contact: string, message: string): Promise<void> {
  const d = db();
  if (!d) return;
  await d.prepare('INSERT INTO waitlist (topic, name, contact, message, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(topic, name.slice(0, 80), contact.slice(0, 120), message.slice(0, 2000), Date.now()).run();
}

export type WaitlistRow = { id: number; topic: string; name: string; contact: string; message: string; createdAt: number };

export async function listWaitlist(limit = 200): Promise<WaitlistRow[]> {
  const { results } = await requireDb().prepare('SELECT id, topic, name, contact, message, created_at AS createdAt FROM waitlist ORDER BY created_at DESC LIMIT ?')
    .bind(limit).all<WaitlistRow>();
  return results;
}

/* ---------- admin ---------- */

export type MemberRow = { id: string; email: string; name: string | null; createdAt: number; lastLoginAt: number | null; children: number; family: boolean; familyEnds: number | null };

export async function listMembers(): Promise<MemberRow[]> {
  const d = requireDb();
  const now = Date.now();
  const { results } = await d.prepare(`
    SELECT m.id, m.email, m.name, m.created_at AS createdAt, m.last_login_at AS lastLoginAt,
      (SELECT COUNT(*) FROM children c WHERE c.member_id = m.id) AS children,
      (SELECT MAX(COALESCE(e.ends_at, 9007199254740991)) FROM entitlements e
         WHERE e.member_id = m.id AND e.plan = ? AND e.status = 'active' AND e.starts_at <= ?) AS familyEnds
    FROM members m ORDER BY m.created_at DESC`).bind(PLAN_FAMILY, now)
    .all<{ id: string; email: string; name: string | null; createdAt: number; lastLoginAt: number | null; children: number; familyEnds: number | null }>();
  return results.map((r) => ({
    ...r,
    family: r.familyEnds !== null && r.familyEnds > now,
    familyEnds: r.familyEnds === null || r.familyEnds >= 9007199254740991 ? null : r.familyEnds,
  }));
}

/** Grant the family plan for `days` (null = no end). Ends any earlier active grant first. */
export async function grantPlan(memberId: string, days: number | null, note: string, grantedBy: string): Promise<void> {
  const d = requireDb();
  const now = Date.now();
  await d.prepare("UPDATE entitlements SET status = 'ended' WHERE member_id = ? AND plan = ? AND status = 'active'").bind(memberId, PLAN_FAMILY).run();
  await d.prepare('INSERT INTO entitlements (member_id, plan, status, starts_at, ends_at, note, granted_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(memberId, PLAN_FAMILY, 'active', now, days === null ? null : now + days * 86_400_000, note.slice(0, 200) || null, grantedBy, now).run();
}

/** Grant a one-time or recurring entitlement without duplicating an active row. */
export async function grantEntitlement(memberId: string, plan: string, days: number | null, note: string, grantedBy: string): Promise<void> {
  const d = requireDb();
  const now = Date.now();
  const current = await d.prepare(
    `SELECT id FROM entitlements WHERE member_id = ? AND plan = ? AND status = 'active'
     AND (ends_at IS NULL OR ends_at > ?) LIMIT 1`,
  ).bind(memberId, plan, now).first<{ id: number }>();
  if (current) return;
  await d.prepare('INSERT INTO entitlements (member_id, plan, status, starts_at, ends_at, note, granted_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(memberId, plan, 'active', now, days === null ? null : now + days * 86_400_000, note.slice(0, 200) || null, grantedBy.slice(0, 80), now).run();
}

export async function revokePlan(memberId: string): Promise<void> {
  await requireDb().prepare("UPDATE entitlements SET status = 'ended', ends_at = ? WHERE member_id = ? AND plan = ? AND status = 'active'")
    .bind(Date.now(), memberId, PLAN_FAMILY).run();
}

/** Create a member row by hand (a founding family who has not signed in yet). */
export async function ensureMember(rawEmail: string, name: string | null): Promise<string> {
  const email = normalizeEmail(rawEmail);
  const d = requireDb();
  const row = await d.prepare('SELECT id FROM members WHERE email = ?').bind(email).first<{ id: string }>();
  if (row) return row.id;
  const id = newId();
  await d.prepare('INSERT INTO members (id, email, name, created_at) VALUES (?, ?, ?, ?)').bind(id, email, name, Date.now()).run();
  return id;
}
