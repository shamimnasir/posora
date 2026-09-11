#!/usr/bin/env node
/**
 * Turn an admin password into the PBKDF2 string stored as ADMIN_PASSWORD_HASH.
 * Must match verifyPassword() in src/lib/auth.ts.
 *
 *   node scripts/hash-password.mjs 'my long passphrase'
 *
 * Then:
 *   npx wrangler secret put ADMIN_PASSWORD_HASH
 */
import { webcrypto as crypto } from 'node:crypto';

const ITERATIONS = 210_000;
const password = process.argv[2];

if (!password) {
  console.error("usage: node scripts/hash-password.mjs 'your password'");
  process.exit(1);
}
if (password.length < 12) {
  console.error('Use at least 12 characters - this is the only key to the panel.');
  process.exit(1);
}

const b64 = (bytes) => Buffer.from(bytes).toString('base64');
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256);

console.log(`pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`);
