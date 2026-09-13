#!/usr/bin/env node
/**
 * Turn an admin password into the PBKDF2 string stored as ADMIN_PASSWORD_HASH.
 * Must match verifyPassword() in src/lib/auth.ts.
 *
 *   node scripts/hash-password.mjs
 *
 * It asks for the password and does not echo it. Then:
 *
 *   npx wrangler secret put ADMIN_PASSWORD_HASH
 *
 * The password used to be argv[2], which meant the only key to the panel was
 * typed on a command line and written verbatim into ~/.zsh_history, where it
 * stays until somebody remembers to go and delete it. Nobody remembers. It
 * also meant a copied instruction could be run with its own placeholder still
 * in the quotes, and the panel would happily take that as the password. An
 * argument is still accepted for scripting, with a warning, and a password
 * piped on stdin is the quiet way to do it from another program.
 */
import { webcrypto as crypto } from 'node:crypto';
import { createInterface } from 'node:readline';

const ITERATIONS = 210_000;
const MIN = 12;

/** Ask on the terminal with the echo turned off, so it never reaches the screen. */
function askHidden(question) {
  return new Promise((resolve) => {
    const out = process.stdout;
    const write = out.write.bind(out);
    let muted = false;
    out.write = (chunk, ...rest) => (muted ? true : write(chunk, ...rest));
    const rl = createInterface({ input: process.stdin, output: out, terminal: true });
    rl.question(question, (answer) => {
      out.write = write;
      write('\n');
      rl.close();
      resolve(answer);
    });
    muted = true;
  });
}

/** Whatever arrives on stdin when it is a pipe rather than a terminal. */
async function readPiped() {
  let buf = '';
  for await (const chunk of process.stdin) buf += chunk;
  return buf.replace(/\r?\n$/, '');
}

const fromArg = process.argv[2];
if (fromArg) {
  console.error('Warning: a password given as an argument is saved in your shell history.');
  console.error('         Run it with no argument to be asked for one instead.');
}
const password = fromArg ?? (process.stdin.isTTY ? await askHidden('New admin password: ') : await readPiped());

if (!password) {
  console.error('No password given.');
  process.exit(1);
}
if (password.length < MIN) {
  console.error(`Use at least ${MIN} characters - this is the only key to the panel.`);
  process.exit(1);
}

const b64 = (bytes) => Buffer.from(bytes).toString('base64');
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256);

console.log(`pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`);
