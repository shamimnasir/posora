import type { APIRoute } from 'astro';
import { COOKIE, destroySession, sameOrigin } from '../../../lib/auth';
import { dbEnv } from '../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request, url, cookies, redirect }) => {
  if (!sameOrigin(request, url)) return new Response('forbidden', { status: 403 });
  const token = cookies.get(COOKIE)?.value;
  if (token && dbEnv().DB) await destroySession(token);
  cookies.delete(COOKIE, { path: '/' });
  // context redirect, not Response.redirect: that one's headers are immutable,
  // so the cleared cookie and the security headers could not be set on it
  return redirect('/admin/login', 303);
};
