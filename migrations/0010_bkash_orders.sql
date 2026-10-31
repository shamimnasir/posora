-- bKash Tokenized Checkout beside SSLCommerz, and an instant-download key.
-- Apply with:  npx wrangler d1 migrations apply posora --remote
--
-- `gateway` says which rail took the order. `gateway_ref` is bKash's
-- paymentID, the handle every execute and status call needs. bKash's trxID
-- goes in the existing bank_tran_id column.
--
-- `download_key` is a random secret made with the order and shown only on the
-- buyer's own confirmation page and receipt email, so a paid buyer can download
-- straight away without signing in. It opens that order's files and nothing
-- else: it is not a sign-in and grants no account access.
ALTER TABLE orders ADD COLUMN gateway TEXT NOT NULL DEFAULT 'sslcommerz';
ALTER TABLE orders ADD COLUMN gateway_ref TEXT;
ALTER TABLE orders ADD COLUMN download_key TEXT;
CREATE INDEX IF NOT EXISTS orders_gateway_ref ON orders (gateway_ref);
