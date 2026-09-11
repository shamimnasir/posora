import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

type Env = {
  EMAIL?: { send(msg: { to: string; from: { email: string; name: string }; replyTo?: string; subject: string; text: string; html: string }): Promise<unknown> };
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const clip = (s: unknown, n: number) => String(s ?? '').trim().slice(0, n);

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get('content-type')?.includes('application/json') !== true) return json({ ok: false, error: 'bad-request' }, 415);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad-json' }, 400); }

  // Honeypot: real users never fill this.
  if (clip(body.website, 10)) return json({ ok: true });

  const name = clip(body.name, 80), contact = clip(body.contact, 120), message = clip(body.message, 2000);
  if (name.length < 2 || contact.length < 5 || message.length < 5) return json({ ok: false, error: 'invalid' }, 422);

  const e = env as unknown as Env;
  if (!e.EMAIL) return json({ ok: false, error: 'email-unavailable' }, 503);

  const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ? contact : undefined;
  const text = `নাম: ${name}\nযোগাযোগ: ${contact}\n\n${message}`;
  try {
    await e.EMAIL.send({
      to: e.CONTACT_TO ?? 'support@posora.com',
      from: { email: e.CONTACT_FROM ?? 'no-reply@posora.com', name: 'পসরা যোগাযোগ ফর্ম' },
      replyTo,
      subject: `পসরা: ${name} লিখেছেন`,
      text,
      html: `<p><b>নাম:</b> ${esc(name)}<br><b>যোগাযোগ:</b> ${esc(contact)}</p><p>${esc(message).replace(/\n/g, '<br>')}</p>`,
    });
    return json({ ok: true });
  } catch (err) {
    console.error('contact send failed', err);
    return json({ ok: false, error: 'send-failed' }, 502);
  }
};

export const ALL: APIRoute = () => json({ ok: false, error: 'method' }, 405);
