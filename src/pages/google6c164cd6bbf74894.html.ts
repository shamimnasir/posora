/**
 * Google Search Console ownership proof.
 *
 * Served by the worker rather than dropped in `public/`, because Cloudflare's
 * static asset handling strips a `.html` extension and 307s to the bare path:
 * a file at public/google….html answered the exact URL Google checks with a
 * redirect, not the file. Google asks for this precise path and expects the
 * token back, so it is a route, the same way sitemap.xml is.
 *
 * The body is the file Search Console generated, byte for byte, with no
 * trailing newline. It has to stay reachable: Google re-checks periodically
 * and un-verifies the property if it disappears.
 */
import type { APIRoute } from 'astro';

export const prerender = false;

const TOKEN = 'google-site-verification: google6c164cd6bbf74894.html';

export const GET: APIRoute = () =>
  new Response(TOKEN, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
