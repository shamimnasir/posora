import type { APIRoute } from 'astro';
import { sameOrigin } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { destroyMemberSession, MEMBER_COOKIE, CHILD_COOKIE } from '../../../lib/members';

export const prerender = false;

export const POST: APIRoute = async ({ request, url, cookies, redirect }) => {
  if (!sameOrigin(request, url)) return new Response('forbidden', { status: 403 });
  if (db()) {
    try { await destroyMemberSession(cookies.get(MEMBER_COOKIE)?.value); } catch { /* already gone */ }
  }
  cookies.delete(MEMBER_COOKIE, { path: '/' });
  cookies.delete(CHILD_COOKIE, { path: '/' });
  return redirect('/account/', 303);
};

export const ALL: APIRoute = () => new Response('method not allowed', { status: 405 });
