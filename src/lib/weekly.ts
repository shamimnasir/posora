/**
 * The weekly letter run, in one place.
 *
 * Three things can start it: the Cloudflare cron trigger through the worker's
 * `scheduled` handler, the button in the admin panel, and an outside scheduler
 * holding CRON_SECRET. All three call this, so there is exactly one definition
 * of what "send the weekly letters" means and nothing to keep in step.
 *
 * The run is idempotent by the week. A cron trigger has no delivery guarantee
 * worth relying on, and an operator who watched a run fail halfway will quite
 * reasonably press the button again; neither may put two letters in a parent's
 * inbox in the same week. Every letter sent is recorded, and a second run skips
 * whoever already has one and picks up whoever does not.
 */
import { requireDb } from './db';
import { familyWeek, listChildren, type Child } from './members';
import { buildLetter, letterOrder } from './parent-email';
import { getWorlds } from './content';
import { dhakaDay } from './daily';

export type Mail = {
  send(msg: { to: string; from: { email: string; name: string }; subject: string; text: string; html: string }): Promise<unknown>;
};

export type WeeklyResult = {
  ok: true;
  week: string;
  dry: boolean;
  /** Members holding a live family plan when the run started. */
  members: number;
  sent: number;
  /** Nothing happened for them this week, so nothing was sent. */
  quiet: number;
  /** Already had this week's letter; a repeat run is not a second letter. */
  already: number;
  failed: number;
  preview?: { to: string; subject: string; text: string }[];
};

/**
 * The Monday of the current week in Dhaka, as the key a letter is filed under.
 * Monday rather than the run date, so a run that slips to Saturday because of a
 * retry still counts as the same week's letter.
 */
export function weekKey(now = new Date()): string {
  const today = dhakaDay(now);
  const d = new Date(`${today}T00:00:00Z`);
  // getUTCDay: 0 is Sunday. Monday is the start of the week here.
  const back = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - back);
  return d.toISOString().slice(0, 10);
}

/**
 * Send this week's letters.
 *
 * `dry` builds every letter, writes nothing and sends nothing, which is how a
 * change to the wording is checked before it reaches a parent.
 */
export async function runWeekly(opts: { origin: string; mail?: Mail; from?: string; dry?: boolean }): Promise<WeeklyResult> {
  const { origin, mail, from = 'no-reply@posora.com', dry = false } = opts;
  const d = requireDb();
  const now = Date.now();
  const week = weekKey();

  const { results: members } = await d.prepare(
    `SELECT DISTINCT m.id, m.email
     FROM members m JOIN entitlements en ON en.member_id = m.id
     WHERE en.plan = 'family' AND en.status = 'active'
       AND en.starts_at <= ? AND (en.ends_at IS NULL OR en.ends_at > ?)`,
  ).bind(now, now).all<{ id: string; email: string }>();

  const { results: done } = await d.prepare('SELECT member_id FROM letters WHERE week = ?')
    .bind(week).all<{ member_id: string }>();
  const sentAlready = new Set(done.map((r) => r.member_id));

  const worlds = await getWorlds();
  const names = new Map(worlds.map((w) => [w.slug, w.bn]));
  const worldName = (slug: string) => names.get(slug) ?? slug;

  let sent = 0, quiet = 0, already = 0, failed = 0;
  const preview: WeeklyResult['preview'] = dry ? [] : undefined;

  for (const m of letterOrder(members)) {
    if (!dry && sentAlready.has(m.id)) { already++; continue; }

    let kids: Child[] = [];
    try { kids = await listChildren(m.id); } catch { failed++; continue; }
    if (!kids.length) { quiet++; continue; }

    const letter = buildLetter(await familyWeek(kids), { origin, worldName });
    // A quiet week gets no letter at all. An email that arrives every Monday to
    // say nothing happened is how a sender gets muted.
    if (!letter) { quiet++; continue; }

    if (dry) { preview!.push({ to: m.email, subject: letter.subject, text: letter.text }); continue; }
    if (!mail) { failed++; continue; }

    try {
      await mail.send({ to: m.email, from: { email: from, name: 'পসরা' }, subject: letter.subject, text: letter.text, html: letter.html });
      // Written only after the send resolves, so a failure is retried next run
      // rather than silently marked as delivered.
      await d.prepare('INSERT OR IGNORE INTO letters (member_id, week, sent_at, subject) VALUES (?, ?, ?, ?)')
        .bind(m.id, week, Date.now(), letter.subject.slice(0, 200)).run();
      sent++;
    } catch {
      failed++;
    }
  }

  return { ok: true, week, dry, members: members.length, sent, quiet, already, failed, preview };
}

export type LetterRow = { member_id: string; email: string | null; week: string; sent_at: number; subject: string | null };

/** The most recent letters, for the admin panel. */
export async function recentLetters(limit = 20): Promise<LetterRow[]> {
  const { results } = await requireDb().prepare(
    `SELECT l.member_id, m.email, l.week, l.sent_at AS sent_at, l.subject
     FROM letters l LEFT JOIN members m ON m.id = l.member_id
     ORDER BY l.sent_at DESC LIMIT ?`,
  ).bind(limit).all<LetterRow>();
  return results;
}
