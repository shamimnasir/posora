/**
 * Applies the security headers to every Worker-rendered response.
 *
 * `public/_headers` only covers static asset responses, and almost every page
 * here renders on demand (`prerender = false`), so those responses would ship
 * without a CSP. `src/lib/headers.ts` is the single definition; this file just
 * puts it on the wire. Keep it and `public/_headers` in sync.
 */
import { defineMiddleware } from 'astro:middleware';
import { SECURITY_HEADERS } from './lib/headers';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  /**
   * Built fresh rather than mutated in place.
   *
   * A response from `Response.redirect()` carries the Fetch spec's "immutable"
   * header guard, so `response.headers.set(...)` on one throws
   * `TypeError: Can't modify immutable headers` - and because this middleware
   * runs on every response, that turned every such route into a 500. The whole
   * admin write path went that way: nobody could log in, log out, or publish.
   * Copying into a new Response is the only way to put a header on one, and
   * doing it unconditionally means a redirect added later cannot bring the
   * route down the same way.
   */
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
});
