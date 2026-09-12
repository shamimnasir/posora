import type { APIRoute } from 'astro';
import { sameOrigin } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { consumeMagicLink, MEMBER_COOKIE, cookieOptions } from '../../../lib/members';

export const prerender = false;

/**
 * Spend the emailed link. This is a POST on purpose.
 *
 * Mail gateways fetch every URL in a message to scan it, so if a GET signed
 * you in, the scanner would spend the single-use link before the person ever
 * clicked and they would be locked out with nothing to tell them why. The page
 * behind the link only looks at the token; this route, reached by a form the
 * person submits from that page, is what actually signs them in. A scanner
 * issues GETs, and the same-origin check turns away anything posted from
 * somewhere else.
 *
 * It answers with a redirect rather than JSON because the form works without
 * JavaScript.
 */
export const POST: APIRoute = async (ctx) => {
  const { request, url, cookies } = ctx;
  const back = (why: string) => new Response(null, { status: 303, headers: { location: `/account/verify?e=${why}`, 'cache-control': 'no-store' } });
  if (!sameOrigin(request, url)) return back('origin');
  if (!db()) return back('unavailable');

  let token = '';
  try {
    const form = await request.formData();
    token = String(form.get('t') ?? '');
  } catch { return back('bad'); }

  try {
    const session = await consumeMagicLink(token, request.headers.get('user-agent'));
    if (!session) return back('stale');
    cookies.set(MEMBER_COOKIE, session, cookieOptions(url.protocol === 'https:'));
    return new Response(null, { status: 303, headers: { location: '/account/?welcome=1', 'cache-control': 'no-store' } });
  } catch (err) {
    console.error('verify failed', err);
    return back('failed');
  }
};

export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ ok: false, error: 'method' }), { status: 405, headers: { 'content-type': 'application/json' } });
