/** Begin Google sign-in: stash a state value and hand the browser to Google. */
import type { APIRoute } from 'astro';
import { sameOrigin } from '../../../../lib/auth';
import { STATE_COOKIE, authorizeUrl, googleReady, newState } from '../../../../lib/google-auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, url, cookies, redirect }) => {
  if (!sameOrigin(request, url)) return new Response('forbidden', { status: 403 });
  if (!googleReady()) return redirect('/admin/login?e=gsetup', 303);

  const state = newState();
  cookies.set(STATE_COOKIE, state, {
    path: '/api/admin/oauth',
    httpOnly: true,
    sameSite: 'lax',      // must survive the redirect back from Google
    secure: url.protocol === 'https:',
    maxAge: 600,
  });
  return redirect(authorizeUrl(url, state), 303);
};
