-- One row per weekly letter actually sent, so a letter is sent once.
-- Apply with:  npx wrangler d1 migrations apply posora --remote
--
-- Why this table exists at all: the weekly run is fired by a Cloudflare cron
-- trigger, and a cron trigger has no delivery guarantee worth relying on. It
-- can fire twice, and an operator can quite reasonably press the button in the
-- admin panel after a run that looked like it failed halfway. Neither of those
-- may put two letters in a parent's inbox in one week.
--
-- The key is (member, week) rather than a single "the job ran" flag, because a
-- run that dies after twenty of fifty letters should resume at twenty one, not
-- refuse to run and not start again from the beginning.
CREATE TABLE IF NOT EXISTS letters (
  member_id TEXT NOT NULL,
  -- The Monday of the letter's week, as YYYY-MM-DD in Asia/Dhaka.
  week      TEXT NOT NULL,
  sent_at   INTEGER NOT NULL,
  -- Kept for the admin panel: what the parent was told, in one line.
  subject   TEXT,
  PRIMARY KEY (member_id, week)
);
CREATE INDEX IF NOT EXISTS letters_week ON letters (week, sent_at DESC);
