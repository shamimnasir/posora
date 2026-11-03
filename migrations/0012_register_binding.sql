-- A password set at registration takes effect only in the browser that set it.
-- Apply with:  npx wrangler d1 migrations apply posora --remote
--
-- Before this, registering wrote the password straight onto the (unverified)
-- member row, and proving the address by ANY code or link verified that row,
-- password included. So a stranger could register someone else's address with
-- a password of their own, wait for the owner to sign in by code (or click the
-- link in the unexpected email), and then walk in with that password.
--
-- Now the sign-in request made by registration carries the password hash and a
-- hash of a random value cookied to the registering browser. Proving the
-- address keeps the password only when that same browser does the proving;
-- any other first verification clears it.
ALTER TABLE member_tokens ADD COLUMN pw_hash TEXT;
ALTER TABLE member_tokens ADD COLUMN bind_hash TEXT;
