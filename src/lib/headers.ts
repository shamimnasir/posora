/**
 * Security headers for Worker-rendered responses.
 *
 * `public/_headers` only applies to static asset responses. Once pages started
 * rendering on demand they stopped going through that path, so the same policy
 * has to be applied in middleware. Keep the two in sync: if you edit the CSP
 * here, edit `public/_headers` to match (it still covers the prerendered
 * contact page, fonts, CSS and JS).
 */
export const CSP = [
  "default-src 'self'",
  "script-src 'self' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://www.google-analytics.com",
  "font-src 'self'",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

export const SECURITY_HEADERS: Record<string, string> = {
  'content-security-policy': CSP,
  // 180 days, this host only. No includeSubDomains and no preload: posora.com
  // itself has always been HTTPS behind Cloudflare, but a future subdomain
  // served over plain HTTP would be locked out by the wider forms, and preload
  // is effectively permanent.
  'strict-transport-security': 'max-age=15552000',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'cross-origin-opener-policy': 'same-origin',
};
