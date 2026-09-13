/**
 * Google's answer. Check the state, trade the code, check the address, and
 * only then make a session.
 *
 * Google arrives here by redirecting the browser, so this is a GET and cannot
 * use the same-origin check the form posts use. The `state` cookie is what
 * stands in for it: a callback that does not carry the value this browser was
 * given a moment ago is not the flow this browser started.
 */
import type { APIRoute } from 'astro';
import { COOKIE, cookieOptions, createSession } from '../../../../lib/auth';
import { audit, requireDb } from '../../../../lib/db';
import { STATE_COOKIE, allowed, claimsForCode, googleReady } from '../../../../lib/google-auth';

export const prerender = false;

export const GET: APIRoute = async ({ request, url, cookies, redirect }) => {
  const clearState = () => cookies.delete(STATE_COOKIE, { path: '/api/admin/oauth' });

  if (!googleReady()) { clearState(); return redirect('/admin/login?e=gsetup', 303); }

  // Google reports a refusal (the chooser was closed, consent declined) here
  if (url.searchParams.get('error')) { clearState(); return redirect('/admin/login?e=gdenied', 303); }

  const expected = cookies.get(STATE_COOKIE)?.value;
  const got = url.searchParams.get('state');
  clearState();
  if (!expected || !got || expected !== got) return redirect('/admin/login?e=gstate', 303);

  const code = url.searchParams.get('code');
  if (!code) return redirect('/admin/login?e=gstate', 303);

  const email = allowed(await claimsForCode(code, url));
  if (!email) {
    // an address Google verified but the allowlist does not know, or a token
    // exchange that failed: worth a row either way, it is an attempt to enter
    await audit(requireDb(), 'login.google.refused', 'unlisted');
    return redirect('/admin/login?e=gdenied', 303);
  }

  const token = await createSession(request.headers.get('user-agent'));
  cookies.set(COOKIE, token, cookieOptions(url.protocol === 'https:'));
  await audit(requireDb(), 'login.google.ok', email);
  return redirect('/admin', 303);
};
