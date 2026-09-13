import type { APIContext, APIRoute } from 'astro';
import {
  COOKIE, checkThrottle, clearFailures, clientIp, cookieOptions,
  createSession, noteFailure, sameOrigin, verifyPassword,
} from '../../../lib/auth';
import { audit, dbEnv, requireDb } from '../../../lib/db';

export const prerender = false;

/**
 * `redirect` from the route context, not `Response.redirect`.
 *
 * A response built by `Response.redirect()` has immutable headers, so neither
 * the session cookie set below nor the site's security headers could be put
 * on it: the whole route answered 500 and the panel could not be entered.
 */
const back = (redirect: APIContext['redirect'], e: string) => redirect(`/admin/login?e=${e}`, 303);

export const POST: APIRoute = async ({ request, url, cookies, redirect }) => {
  if (!sameOrigin(request, url)) return new Response('forbidden', { status: 403 });

  const env = dbEnv();
  if (!env.DB || !env.ADMIN_PASSWORD_HASH) return back(redirect, 'setup');

  const ip = clientIp(request);
  const throttle = await checkThrottle(ip);
  if (throttle.blocked) return back(redirect, 'locked');

  const form = await request.formData();
  const password = String(form.get('password') ?? '');

  if (!(await verifyPassword(password, env.ADMIN_PASSWORD_HASH))) {
    await noteFailure(ip);
    await audit(requireDb(), 'login.failed', ip);
    return back(redirect, 'bad');
  }

  await clearFailures(ip);
  const token = await createSession(request.headers.get('user-agent'));
  cookies.set(COOKIE, token, cookieOptions(url.protocol === 'https:'));
  await audit(requireDb(), 'login.ok', ip);

  return redirect('/admin', 303);
};
