import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { isLoggedIn } from '../../../lib/auth';
import { requireDb } from '../../../lib/db';
import { familyWeek, listChildren, type Child } from '../../../lib/members';
import { buildLetter, letterOrder } from '../../../lib/parent-email';
import { getWorlds } from '../../../lib/content';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

type Env = {
  EMAIL?: { send(msg: { to: string; from: { email: string; name: string }; subject: string; text: string; html: string }): Promise<unknown> };
  CONTACT_FROM?: string;
  /** Shared secret for an outside scheduler. Set with `wrangler secret put CRON_SECRET`. */
  CRON_SECRET?: string;
};

/**
 * The weekly letter run.
 *
 * Cloudflare's cron triggers call a worker's `scheduled` handler, and the
 * Astro adapter owns the worker entry, so there is no scheduled handler to
 * hang this on without taking over that entry. Instead this is an ordinary
 * authenticated endpoint, which means it can be fired three ways: by hand from
 * the admin panel, by any outside scheduler holding CRON_SECRET, and later by
 * a two-line cron worker that does nothing but fetch it. All three do exactly
 * the same thing, so nothing has to be rewritten when the automation lands.
 *
 * `?dry=1` builds every letter and sends none, which is how a change to the
 * wording gets checked before it reaches a single parent.
 */
export const POST: APIRoute = async (ctx) => {
  const { request, url } = ctx;
  const e = env as unknown as Env;

  // Either an admin at the keyboard, or a scheduler with the secret. The
  // secret is compared only when one is configured, so a deployment without
  // it simply has no machine path in.
  const auth = request.headers.get('authorization') ?? '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const bySecret = !!e.CRON_SECRET && bearer.length === e.CRON_SECRET.length && bearer === e.CRON_SECRET;
  if (!bySecret && !(await isLoggedIn(ctx))) return json({ ok: false, error: 'auth' }, 401);

  const dry = url.searchParams.get('dry') === '1';
  const d = requireDb();
  const now = Date.now();

  // Everyone holding a live family entitlement, one row per member.
  const { results: members } = await d.prepare(
    `SELECT DISTINCT m.id, m.email, m.name
     FROM members m JOIN entitlements en ON en.member_id = m.id
     WHERE en.plan = 'family' AND en.status = 'active'
       AND en.starts_at <= ? AND (en.ends_at IS NULL OR en.ends_at > ?)`,
  ).bind(now, now).all<{ id: string; email: string; name: string | null }>();

  const worlds = await getWorlds();
  const names = new Map(worlds.map((w) => [w.slug, w.bn]));
  const worldName = (slug: string) => names.get(slug) ?? slug;
  const origin = url.origin;

  let sent = 0, quiet = 0, failed = 0;
  const preview: { to: string; subject: string; text: string }[] = [];

  for (const m of letterOrder(members)) {
    let kids: Child[] = [];
    try { kids = await listChildren(m.id); } catch { failed++; continue; }
    if (!kids.length) { quiet++; continue; }

    const rows = await familyWeek(kids);
    const letter = buildLetter(rows, { origin, worldName });
    // A quiet week gets no letter at all. An email that arrives every Monday
    // to say nothing happened is how a sender gets muted.
    if (!letter) { quiet++; continue; }

    if (dry) { preview.push({ to: m.email, subject: letter.subject, text: letter.text }); continue; }
    if (!e.EMAIL) return json({ ok: false, error: 'email-unavailable', sent, quiet }, 503);
    try {
      await e.EMAIL.send({
        to: m.email,
        from: { email: e.CONTACT_FROM ?? 'no-reply@posora.com', name: 'পসরা' },
        subject: letter.subject,
        text: letter.text,
        html: letter.html,
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return json({ ok: true, dry, members: members.length, sent, quiet, failed, preview: dry ? preview : undefined });
};
