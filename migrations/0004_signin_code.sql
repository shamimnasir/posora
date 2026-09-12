-- A typed code beside the emailed link, and a guard on guessing it.
-- Apply with:  npx wrangler d1 migrations apply posora --remote
--
-- Two problems with a link on its own, both of which lock a parent out with no
-- way to tell why:
--
--  1. Mail gateways (Defender, Mimecast, Proofpoint and the rest) fetch every
--     URL in a message to scan it. A single-use link is spent by the scanner
--     before the person ever clicks.
--  2. Tapping a link inside the Gmail app opens Gmail's own in-app browser.
--     The session cookie is set there, and when the parent later opens Chrome
--     they are signed out with no explanation. For a mobile-first Bangladeshi
--     audience this is the more common of the two.
--
-- A six digit code typed into the page they already have open sidesteps both.
-- Six digits is only about twenty bits, so it is safe only because guesses are
-- counted: `attempts` is bumped on every wrong try and the row is dead after
-- CODE_TRIES. With five sign-in requests an hour that caps an attacker at a
-- few dozen guesses against a million, per hour, per address.
ALTER TABLE member_tokens ADD COLUMN code_hash TEXT;
ALTER TABLE member_tokens ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;

-- The code is looked up by (email, code_hash), never by code alone: six digits
-- on their own are trivially enumerable.
CREATE INDEX IF NOT EXISTS member_tokens_code ON member_tokens (email, code_hash);
