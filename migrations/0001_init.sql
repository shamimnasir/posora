-- পসরা admin: content, sessions and audit trail.
-- Apply with:  npx wrangler d1 migrations apply posora --remote

-- One row per world. Nested structures stay as JSON so the shape matches
-- src/data/worlds.ts exactly and needs no translation layer.
CREATE TABLE IF NOT EXISTS worlds (
  slug              TEXT PRIMARY KEY,
  bn                TEXT NOT NULL,
  en                TEXT NOT NULL,
  tag               TEXT NOT NULL,
  hue               TEXT NOT NULL,
  age               TEXT NOT NULL,
  dep               TEXT NOT NULL,
  phase             TEXT NOT NULL,
  intro             TEXT NOT NULL,
  keys_json         TEXT NOT NULL DEFAULT '[]',
  key_cats_json     TEXT NOT NULL DEFAULT '[]',
  cats_json         TEXT NOT NULL DEFAULT '[]',
  missions_json     TEXT NOT NULL DEFAULT '[]',
  mission_cats_json TEXT NOT NULL DEFAULT '[]',
  -- `open` = has a bespoke explorer (space). Drives which template renders.
  open              INTEGER NOT NULL DEFAULT 0,
  -- 'published' shows on the live site; 'draft' is visible only in admin preview.
  status            TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  sort              INTEGER NOT NULL DEFAULT 0,
  updated_at        INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS worlds_status_sort ON worlds (status, sort);

-- Everything that isn't a world: space bodies, math tools, language tables, heroes.
-- Stored as whole JSON documents, edited as JSON in the panel.
CREATE TABLE IF NOT EXISTS datasets (
  key        TEXT PRIMARY KEY,
  json       TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Session ids are stored as SHA-256 hashes: a dump of this table cannot be
-- replayed as a cookie.
CREATE TABLE IF NOT EXISTS sessions (
  id_hash    TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  ua         TEXT
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions (expires_at);

-- Failed-login throttle, keyed by client IP.
CREATE TABLE IF NOT EXISTS login_throttle (
  ip    TEXT PRIMARY KEY,
  fails INTEGER NOT NULL DEFAULT 0,
  until INTEGER NOT NULL DEFAULT 0
);

-- Every mutation, so you can see what changed and when.
CREATE TABLE IF NOT EXISTS audit (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  at     INTEGER NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT
);
CREATE INDEX IF NOT EXISTS audit_at ON audit (at DESC);
