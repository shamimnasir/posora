-- পসরা পরিবার: member accounts, entitlements, child profiles, synced progress.
-- Apply with:  npx wrangler d1 migrations apply posora --remote
--
-- Design rules that shape this schema:
--  * Only an adult has an account. A child is a nickname and a reading level
--    under a member, never an email, a birthday or a photo.
--  * No passwords. Sign-in is a one-time emailed link; the token is stored
--    hashed and single-use.
--  * Session ids are stored hashed, the same way the admin sessions are, so a
--    dump of this table cannot be replayed as a cookie.
--  * Entitlements are rows, not a flag, so a grant has a start, an end, a note
--    and a record of who gave it. Until a payment rail exists every grant is
--    made by hand from the admin panel.

CREATE TABLE IF NOT EXISTS members (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  created_at    INTEGER NOT NULL,
  last_login_at INTEGER
);

-- One-time sign-in links. `email` rather than member_id because the first link
-- a person ever receives is what creates their member row.
CREATE TABLE IF NOT EXISTS member_tokens (
  token_hash  TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  used_at     INTEGER
);
CREATE INDEX IF NOT EXISTS member_tokens_email ON member_tokens (email, created_at DESC);

CREATE TABLE IF NOT EXISTS member_sessions (
  id_hash    TEXT PRIMARY KEY,
  member_id  TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  ua         TEXT
);
CREATE INDEX IF NOT EXISTS member_sessions_member ON member_sessions (member_id);
CREATE INDEX IF NOT EXISTS member_sessions_expiry ON member_sessions (expires_at);

-- What a member is allowed to use. `plan` is a string so a second plan can be
-- added without a migration. `status` flips to 'ended' on revoke; the row is
-- kept so the history stays visible.
CREATE TABLE IF NOT EXISTS entitlements (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id  TEXT NOT NULL,
  plan       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  starts_at  INTEGER NOT NULL,
  ends_at    INTEGER,
  note       TEXT,
  granted_by TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS entitlements_member ON entitlements (member_id, status);

CREATE TABLE IF NOT EXISTS children (
  id         TEXT PRIMARY KEY,
  member_id  TEXT NOT NULL,
  nickname   TEXT NOT NULL,
  level      TEXT NOT NULL DEFAULT 'l1' CHECK (level IN ('l1', 'l2', 'l3')),
  sort       INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS children_member ON children (member_id, sort);

-- Mirror of the localStorage progress, keyed the same way the site keys it
-- (`world` slug + the "category:item" key), so a device and the server can be
-- merged as a plain set union.
CREATE TABLE IF NOT EXISTS child_progress (
  child_id  TEXT NOT NULL,
  world     TEXT NOT NULL,
  item_key  TEXT NOT NULL,
  seen_at   INTEGER NOT NULL,
  PRIMARY KEY (child_id, world, item_key)
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id  TEXT NOT NULL,
  world     TEXT NOT NULL,
  cat       INTEGER NOT NULL,
  score     INTEGER NOT NULL,
  total     INTEGER NOT NULL,
  at        INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS quiz_results_child ON quiz_results (child_id, world, cat, at DESC);

-- The founding list and school enquiries, kept here as well as emailed so the
-- admin panel can show them and nothing depends on an inbox.
CREATE TABLE IF NOT EXISTS waitlist (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  topic      TEXT NOT NULL,
  name       TEXT NOT NULL,
  contact    TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS waitlist_at ON waitlist (created_at DESC);

-- Sign-in link throttle, keyed by email hash and by IP.
CREATE TABLE IF NOT EXISTS member_throttle (
  key   TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  until INTEGER NOT NULL DEFAULT 0
);
