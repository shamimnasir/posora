/**
 * Google sign-in for the admin panel.
 *
 * Only the front door changes. Once Google says who you are and the address
 * is on the allowlist, the existing machinery takes over unaltered: the same
 * `sessions` row, the same opaque cookie, the same `isLoggedIn`. Nothing about
 * how a session is stored or checked is Google's business.
 *
 * The flow is the plain authorization code flow. The browser is sent to
 * Google; Google sends it back with a one-time code; this Worker trades that
 * code for tokens over its own TLS connection to Google. Because the ID token
 * arrives on that server-to-server call rather than through the browser, it
 * needs no JWKS signature check to be trustworthy: it came from Google
 * directly, over a connection only Google could have answered.
 */
import { dbEnv } from './db';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const STATE_COOKIE = 'posora_oauth_state';

/** Configured only when every piece is present; a half-set-up flow is worse than none. */
export function googleReady(): boolean {
  const e = dbEnv();
  return !!(e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET && adminEmails().length);
}

/** The addresses allowed in, lowercased. Anything not on this list is refused. */
export function adminEmails(): string[] {
  return (dbEnv().ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const redirectUri = (url: URL): string => new URL('/api/admin/oauth/callback', url).toString();

/** A random value tying the callback to the browser that started the flow: CSRF cover. */
export const newState = (): string =>
  btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(18))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function authorizeUrl(url: URL, state: string): string {
  const u = new URL(AUTH_URL);
  u.searchParams.set('client_id', dbEnv().GOOGLE_CLIENT_ID!);
  u.searchParams.set('redirect_uri', redirectUri(url));
  u.searchParams.set('response_type', 'code');
  // no profile, no picture, no contacts: the panel only needs to know which
  // address is knocking
  u.searchParams.set('scope', 'openid email');
  u.searchParams.set('state', state);
  // always show the chooser, so a shared machine cannot silently reuse a session
  u.searchParams.set('prompt', 'select_account');
  return u.toString();
}

type Claims = { email?: string; email_verified?: boolean | string };

/** Exchange the one-time code for the ID token's claims, or null if anything is off. */
export async function claimsForCode(code: string, url: URL): Promise<Claims | null> {
  const e = dbEnv();
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: e.GOOGLE_CLIENT_ID!,
      client_secret: e.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(url),
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { id_token?: string };
  if (!body.id_token) return null;
  // the payload of a JWT this Worker just received from Google itself
  const payload = body.id_token.split('.')[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Claims;
  } catch {
    return null;
  }
}

/** Google said this address, it verified it, and it is on the allowlist. */
export function allowed(claims: Claims | null): string | null {
  const email = claims?.email?.trim().toLowerCase();
  if (!email) return null;
  const verified = claims!.email_verified === true || claims!.email_verified === 'true';
  if (!verified) return null;
  return adminEmails().includes(email) ? email : null;
}
