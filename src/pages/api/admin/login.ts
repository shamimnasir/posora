import type { APIRoute } from 'astro';
import {
  COOKIE, checkThrottle, clearFailures, clientIp, cookieOptions,
  createSession, noteFailure, sameOrigin, verifyPassword,
} from '../../../lib/auth';
import { audit, dbEnv, requireDb } from '../../../lib/db';

export const prerender = false;

const back = (url: URL, e: string) => Response.redirect(new URL(`/admin/login?e=${e}`, url), 303);

export const POST: APIRoute = async ({ request, url, cookies }) => {
  if (!sameOrigin(request, url)) return new Response('forbidden', { status: 403 });

  const env = dbEnv();
  if (!env.DB || !env.ADMIN_PASSWORD_HASH) return back(url, 'setup');

  const ip = clientIp(request);
  const throttle = await checkThrottle(ip);
  if (throttle.blocked) return back(url, 'locked');

  const form = await request.formData();
  const password = String(form.get('password') ?? '');

  if (!(await verifyPassword(password, env.ADMIN_PASSWORD_HASH))) {
    await noteFailure(ip);
    await audit(requireDb(), 'login.failed', ip);
    return back(url, 'bad');
  }

  await clearFailures(ip);
  const token = await createSession(request.headers.get('user-agent'));
  cookies.set(COOKIE, token, cookieOptions(url.protocol === 'https:'));
  await audit(requireDb(), 'login.ok', ip);

  return Response.redirect(new URL('/admin', url), 303);
};
