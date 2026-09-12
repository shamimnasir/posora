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
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
});
