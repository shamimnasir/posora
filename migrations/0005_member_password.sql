-- Email and password sign-in for members, alongside the emailed code.
--
-- `email_verified` is the important column. Without it, anyone could register
-- with an address that is not theirs, set a password on it, and be sitting
-- inside the account when its real owner later signs in with an emailed code.
-- So a password account is inert until the code proves the address, and the
-- code path sets this flag on the way through.
ALTER TABLE members ADD COLUMN password_hash TEXT;
ALTER TABLE members ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;

-- Every member who exists today got here through an emailed link or code, so
-- their address is already proven.
UPDATE members SET email_verified = 1;
