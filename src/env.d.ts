/// <reference types="astro/client" />
/** Minimal typing for the Workers runtime env - avoids pulling @cloudflare/workers-types
 *  into the whole project, whose HTMLRewriter `Element` clashes with the DOM lib. */
declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
}
