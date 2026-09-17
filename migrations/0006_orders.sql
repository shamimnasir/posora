-- SSLCommerz-ready order ledger for one-time digital products.
-- Apply with: npx wrangler d1 migrations apply posora --remote
--
-- No card or gateway secret is stored here. The order keeps only the values
-- needed to reconcile an SSLCommerz callback/IPN and grant the purchased
-- entitlement exactly once.
CREATE TABLE IF NOT EXISTS orders (
  id                TEXT PRIMARY KEY,
  tran_id           TEXT NOT NULL UNIQUE,
  product_slug      TEXT NOT NULL,
  member_id         TEXT,
  amount_bdt        INTEGER NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'BDT',
  customer_name     TEXT NOT NULL,
  customer_email    TEXT NOT NULL,
  customer_phone    TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'held')),
  ssl_session_key   TEXT,
  validation_id     TEXT,
  bank_tran_id      TEXT,
  gateway_status    TEXT,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL,
  paid_at           INTEGER
);
CREATE INDEX IF NOT EXISTS orders_email_created ON orders (customer_email, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_updated ON orders (status, updated_at DESC);
