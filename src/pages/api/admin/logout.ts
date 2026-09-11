import type { APIRoute } from 'astro';
import { COOKIE, destroySession, sameOrigin } from '../../../lib/auth';
import { dbEnv } from '../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request, url, cookies }) => {
  if (!sameOrigin(request, url)) return new Response('forbidden', { status: 403 });
  const token = cookies.get(COOKIE)?.value;
  if (token && dbEnv().DB) await destroySession(token);
  cookies.delete(COOKIE, { path: '/' });
  return Response.redirect(new URL('/admin/login', url), 303);
};
