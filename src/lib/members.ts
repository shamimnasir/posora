/**
 * পসরা পরিবার - member accounts.
 *
 * Only an adult has an account, and the account has no password: a one-time
 * link is emailed, clicking it creates the session. Children are a nickname
 * and a reading level under the member, nothing more. Entitlements are rows
 * granted from the admin panel until a payment rail exists.
 *
 * Every function that needs the database throws when D1 is missing, the same
 * as the admin code, so a misconfigured deployment fails loudly rather than
 * pretending to sign people in.
 */
import type { APIContext } from 'astro';
import { env } from 'cloudflare:workers';
import { requireDb, db } from './db';
import { passMark } from './quiz';

export const MEMBER_COOKIE = 'posora_member';
export const CHILD_COOKIE = 'posora_child';
const SESSION_DAYS = 30;
const LINK_MINUTES = 20;
/** Sign-in links per email or per IP inside one hour before we stop sending. */
const LINK_LIMIT = 5;
const LINK_WINDOW_MS = 60 * 60_000;
export const MAX_CHILDREN = 6;
export const PLAN_FAMILY = 'family';

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

async function throttled(key: string): Promise<boolean> {
  const d = requireDb();
  const now = Date.now();
  const row = await d.prepare('SELECT count, until FROM member_throttle WHERE key = ?').bind(key).first<{ count: number; until: number }>();
  if (!row || row.until < now) {
    await d.prepare('INSERT INTO member_throttle (key, count, until) VALUES (?1, 1, ?2) ON CONFLICT(key) DO UPDATE SET count = 1, until = ?2')
      .bind(key, now + LINK_WINDOW_MS).run();
    return false;
  }
  if (row.count >= LINK_LIMIT) return true;
  await d.prepare('UPDATE member_throttle SET count = count + 1 WHERE key = ?').bind(key).run();
  return false;
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
  const now = Date.now();
  await d.prepare('INSERT INTO member_tokens (token_hash, email, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256Hex(token), email, now, now + LINK_MINUTES * 60_000).run();

  const link = `${origin}/account/verify?t=${token}`;
  const text = `পসরায় ঢুকতে নিচের লিংকে চাপুন। লিংকটা ${LINK_MINUTES} মিনিট পর্যন্ত কাজ করবে, একবারই।\n\n${link}\n\nআপনি যদি এটা না চেয়ে থাকেন, কিছু করতে হবে না - কেউ আপনার অ্যাকাউন্টে ঢুকতে পারবে না।`;
  await mail.EMAIL.send({
    to: email,
    from: { email: mail.CONTACT_FROM ?? 'no-reply@posora.com', name: 'পসরা' },
    subject: 'পসরায় ঢোকার লিংক',
    text,
    html: `<p>পসরায় ঢুকতে নিচের লিংকে চাপুন। লিংকটা ${LINK_MINUTES} মিনিট পর্যন্ত কাজ করবে, একবারই।</p><p><a href="${link}">${link}</a></p><p style="color:#666">আপনি যদি এটা না চেয়ে থাকেন, কিছু করতে হবে না।</p>`,
  });
  return 'sent';
}

/** Turn a clicked link into a session. Returns the raw session token, or null. */
export async function verifyMagicLink(token: string, ua: string | null): Promise<string | null> {
  if (!token || token.length < 20) return null;
  const d = requireDb();
  const hash = await sha256Hex(token);
  const row = await d.prepare('SELECT email, expires_at, used_at FROM member_tokens WHERE token_hash = ?')
    .bind(hash).first<{ email: string; expires_at: number; used_at: number | null }>();
  const now = Date.now();
  if (!row || row.used_at || row.expires_at < now) return null;
  await d.prepare('UPDATE member_tokens SET used_at = ? WHERE token_hash = ?').bind(now, hash).run();

  let member = await d.prepare('SELECT id FROM members WHERE email = ?').bind(row.email).first<{ id: string }>();
  if (!member) {
    const id = newId();
    await d.prepare('INSERT INTO members (id, email, created_at, last_login_at) VALUES (?, ?, ?, ?)').bind(id, row.email, now, now).run();
    member = { id };
  } else {
    await d.prepare('UPDATE members SET last_login_at = ? WHERE id = ?').bind(now, member.id).run();
  }

  const session = randomToken();
  await d.prepare('INSERT INTO member_sessions (id_hash, member_id, created_at, expires_at, ua) VALUES (?, ?, ?, ?, ?)')
    .bind(await sha256Hex(session), member.id, now, now + SESSION_DAYS * 86_400_000, ua?.slice(0, 200) ?? null).run();
  return session;
}

export async function destroyMemberSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await requireDb().prepare('DELETE FROM member_sessions WHERE id_hash = ?').bind(await sha256Hex(token)).run();
}

/* ---------- reading a member ---------- */

async function loadMember(d: D1Database, id: string): Promise<Member | null> {
  const m = await d.prepare('SELECT id, email, name, created_at, last_login_at FROM members WHERE id = ?').bind(id)
    .first<{ id: string; email: string; name: string | null; created_at: number; last_login_at: number | null }>();
  if (!m) return null;
  const { results: ents } = await d.prepare('SELECT id, plan, status, starts_at, ends_at, note, granted_by FROM entitlements WHERE member_id = ? ORDER BY created_at DESC')
    .bind(id).all<{ id: number; plan: string; status: 'active' | 'ended'; starts_at: number; ends_at: number | null; note: string | null; granted_by: string }>();
  const { results: kids } = await d.prepare('SELECT id, nickname, level, sort, created_at FROM children WHERE member_id = ? ORDER BY sort, created_at')
    .bind(id).all<{ id: string; nickname: string; level: Level; sort: number; created_at: number }>();
  return {
    id: m.id, email: m.email, name: m.name, createdAt: m.created_at, lastLoginAt: m.last_login_at,
    entitlements: ents.map((e) => ({ id: e.id, plan: e.plan, status: e.status, startsAt: e.starts_at, endsAt: e.ends_at, note: e.note, grantedBy: e.granted_by })),
    children: kids.map((k) => ({ id: k.id, nickname: k.nickname, level: k.level, sort: k.sort, createdAt: k.created_at })),
  };
}

/** The signed-in member for this request, or null. Safe to call when D1 is absent. */
export async function getMember(ctx: APIContext): Promise<Member | null> {
  const d = db();
  const token = ctx.cookies.get(MEMBER_COOKIE)?.value;
  if (!d || !token) return null;
  const hash = await sha256Hex(token);
  const row = await d.prepare('SELECT member_id, expires_at FROM member_sessions WHERE id_hash = ?').bind(hash).first<{ member_id: string; expires_at: number }>();
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    await d.prepare('DELETE FROM member_sessions WHERE id_hash = ?').bind(hash).run();
    return null;
  }
  return loadMember(d, row.member_id);
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
