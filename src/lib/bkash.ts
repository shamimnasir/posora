/**
 * bKash Tokenized Checkout, server side only.
 *
 * The flow, all on bKash's v1.2.0-beta tokenized API:
 *   1. grant token  - username/password headers + app key/secret body.
 *   2. create       - mode 0011 (one-off checkout, no saved agreement); bKash
 *                     answers with a paymentID and the bkashURL we send the
 *                     buyer to.
 *   3. the buyer approves in bKash (wallet number, OTP, PIN) and bKash
 *      redirects them to our callback with ?paymentID=&status=.
 *   4. execute      - the call that actually moves the money. Its answer, or a
 *                     status query when execute is ambiguous, must say
 *                     Completed with our amount, currency and invoice number
 *                     before the order is fulfilled.
 *
 * Credentials are Worker secrets (BKASH_USERNAME, BKASH_PASSWORD,
 * BKASH_APP_KEY, BKASH_APP_SECRET) and never reach the browser. The callback's
 * `status=success` is never trusted on its own: anyone can type that URL.
 */
import { dbEnv, requireDb } from './db';
import {
  cleanBuyer, createOrder, digitalPackReady, fulfilOrder, markOrder, orderByTran, confirmationUrl,
  DIGITAL_PACK_AMOUNT, DIGITAL_PACK_CURRENCY, type BuyerInput,
} from './shop';

const BASES = {
  sandbox: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
  live: 'https://tokenized.pay.bka.sh/v1.2.0-beta',
} as const;

type Cfg = { base: string; username: string; password: string; appKey: string; appSecret: string };

function cfg(): Cfg | null {
  const e = dbEnv();
  if (!e.BKASH_USERNAME || !e.BKASH_PASSWORD || !e.BKASH_APP_KEY || !e.BKASH_APP_SECRET) return null;
  // BKASH_BASE_URL exists only so a local mock can stand in during tests.
  const base = e.BKASH_BASE_URL || (e.BKASH_MODE === 'live' ? BASES.live : BASES.sandbox);
  return { base: base.replace(/\/+$/, ''), username: e.BKASH_USERNAME, password: e.BKASH_PASSWORD, appKey: e.BKASH_APP_KEY, appSecret: e.BKASH_APP_SECRET };
}

type BkashBody = Record<string, unknown> & {
  statusCode?: string; statusMessage?: string; errorCode?: string; errorMessage?: string;
  id_token?: string; expires_in?: number | string;
  paymentID?: string; bkashURL?: string; transactionStatus?: string; trxID?: string;
  amount?: string; currency?: string; merchantInvoiceNumber?: string;
};

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<BkashBody | null> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    const raw = await res.text();
    try { return JSON.parse(raw) as BkashBody; } catch { return { statusCode: `HTTP${res.status}`, statusMessage: raw.slice(0, 120) }; }
  } catch (err) {
    console.error('bKash request failed', url, err);
    return null;
  }
}

// A grant is good for an hour; bKash asks merchants not to grant per payment.
let cached: { token: string; until: number; base: string } | null = null;

async function token(c: Cfg): Promise<string | null> {
  if (cached && cached.base === c.base && cached.until > Date.now()) return cached.token;
  const r = await post(`${c.base}/tokenized/checkout/token/grant`, { username: c.username, password: c.password }, { app_key: c.appKey, app_secret: c.appSecret });
  if (!r?.id_token) {
    console.error('bKash grant failed', r?.statusCode, r?.statusMessage ?? r?.errorMessage);
    return null;
  }
  const life = Math.max(60, Number(r.expires_in) || 3600);
  cached = { token: r.id_token, until: Date.now() + (life - 300) * 1000, base: c.base };
  return r.id_token;
}

const authHeaders = (c: Cfg, t: string) => ({ authorization: t, 'x-app-key': c.appKey });

export type StartResult =
  | { ok: true; tranId: string; url: string }
  | { ok: false; error: 'unavailable' | 'invalid' | 'gateway-failed' };

export async function startBkash(input: BuyerInput, origin: string): Promise<StartResult> {
  const c = cfg();
  if (!c || !digitalPackReady()) return { ok: false, error: 'unavailable' };
  const buyer = cleanBuyer(input);
  if (!buyer) return { ok: false, error: 'invalid' };
  const t = await token(c);
  if (!t) return { ok: false, error: 'gateway-failed' };

  const { tranId } = await createOrder(buyer, 'bkash');
  const digits = buyer.phone.replace(/\D/g, '').replace(/^880/, '0');
  const r = await post(`${c.base}/tokenized/checkout/create`, authHeaders(c, t), {
    mode: '0011',
    // Pre-fills the wallet number on bKash's page when it looks like one.
    payerReference: /^01\d{9}$/.test(digits) ? digits : tranId,
    callbackURL: `${origin}/api/bkash/callback`,
    amount: DIGITAL_PACK_AMOUNT.toFixed(2),
    currency: DIGITAL_PACK_CURRENCY,
    intent: 'sale',
    merchantInvoiceNumber: tranId,
  });
  if (r?.statusCode !== '0000' || !r.paymentID || !r.bkashURL) {
    await markOrder(tranId, 'failed', `create ${r?.statusCode ?? 'network'}`);
    console.error('bKash create failed', r?.statusCode, r?.statusMessage ?? r?.errorMessage);
    return { ok: false, error: 'gateway-failed' };
  }
  await requireDb().prepare('UPDATE orders SET gateway_ref = ?, updated_at = ? WHERE tran_id = ?').bind(String(r.paymentID).slice(0, 80), Date.now(), tranId).run();
  return { ok: true, tranId, url: r.bkashURL };
}

/** One log line per bKash answer: codes and states only, never credentials or tokens. */
function logReply(step: string, tranId: string, r: BkashBody | null): void {
  console.log(`bKash ${step} ${tranId}: ${r ? `code=${r.statusCode ?? '-'} state=${r.transactionStatus ?? '-'} msg=${String(r.statusMessage ?? r.errorMessage ?? '').slice(0, 80)}` : 'no response'}`);
}

/** True only for a completed payment that matches this order exactly. */
function matches(r: BkashBody | null, tranId: string, paymentID: string): boolean {
  if (!r || r.transactionStatus !== 'Completed' || !r.trxID) return false;
  if (r.paymentID && r.paymentID !== paymentID) return false;
  if (r.merchantInvoiceNumber && r.merchantInvoiceNumber !== tranId) return false;
  if (r.currency && r.currency !== DIGITAL_PACK_CURRENCY) return false;
  const amount = Number(r.amount);
  return Number.isFinite(amount) && Math.abs(amount - DIGITAL_PACK_AMOUNT) < 0.001;
}

/**
 * Handle bKash's redirect back to us and return where to send the buyer.
 * Safe to call repeatedly: a paid order short-circuits, and execute on an
 * already-executed payment falls through to a status query.
 */
export async function finishBkash(paymentID: string, status: string, origin: string): Promise<string> {
  console.log(`bKash callback ${paymentID.slice(0, 40)} status=${status.slice(0, 20)}`);
  const fail = (tranId: string, s = 'failed') => confirmationUrl(origin, tranId, null, s);
  if (!/^[A-Za-z0-9]{6,80}$/.test(paymentID)) return new URL('/digital-pack/checkout/?e=bkash', origin).toString();
  const row = await requireDb().prepare("SELECT tran_id FROM orders WHERE gateway = 'bkash' AND gateway_ref = ?").bind(paymentID).first<{ tran_id: string }>();
  if (!row) return new URL('/digital-pack/checkout/?e=bkash', origin).toString();
  const order = await orderByTran(row.tran_id);
  if (!order) return fail(row.tran_id);
  if (order.status === 'paid') return confirmationUrl(origin, order.tran_id, order.download_key);

  if (status === 'cancel' || status === 'failure') {
    await markOrder(order.tran_id, status === 'cancel' ? 'cancelled' : 'failed', `callback ${status}`);
    return fail(order.tran_id, status === 'cancel' ? 'cancelled' : 'failed');
  }

  const c = cfg();
  const t = c ? await token(c) : null;
  if (!c || !t) return fail(order.tran_id, 'pending');

  let r = await post(`${c.base}/tokenized/checkout/execute`, authHeaders(c, t), { paymentID });
  logReply('execute', order.tran_id, r);
  if (!matches(r, order.tran_id, paymentID)) {
    // Execute can time out after the money moved, or refuse because it already
    // ran. The status query is the source of truth in both cases.
    const q = await post(`${c.base}/tokenized/checkout/payment/status`, authHeaders(c, t), { paymentID });
    logReply('status', order.tran_id, q);
    if (matches(q, order.tran_id, paymentID)) r = q;
    else {
      // Only a terminal answer from the status query fails the order; anything
      // else (still Initiated, a timeout) stays pending for a later check.
      const terminal = q?.transactionStatus && !['Initiated', 'Pending Authorized', 'Completed'].includes(q.transactionStatus);
      if (terminal) {
        await markOrder(order.tran_id, 'failed', `${q?.transactionStatus ?? ''} ${r?.statusCode ?? ''}`.trim());
        return fail(order.tran_id);
      }
      // Network trouble with no clear answer: leave it pending and say so.
      return fail(order.tran_id, 'pending');
    }
  }
  await fulfilOrder(order.tran_id, { bankTranId: r!.trxID, validationId: paymentID, gatewayStatus: 'Completed' }, origin);
  return confirmationUrl(origin, order.tran_id, order.download_key);
}

/**
 * Ask bKash about orders still pending after their callback window, and settle
 * them by bKash's own answer. This catches a buyer who paid and closed the tab
 * before coming back, or a callback that timed out after the money moved.
 * It never calls execute: an approved-but-unexecuted payment is voided by
 * bKash, and only the buyer's return to the callback may execute it.
 */
export async function reconcileBkash(origin: string): Promise<{ checked: number; paid: number; failed: number }> {
  const out = { checked: 0, paid: 0, failed: 0 };
  const c = cfg();
  if (!c) return out;
  const now = Date.now();
  const { results } = await requireDb().prepare(
    `SELECT tran_id, gateway_ref, created_at FROM orders WHERE gateway = 'bkash' AND status = 'pending' AND gateway_ref IS NOT NULL
       AND created_at < ? AND created_at > ? ORDER BY created_at LIMIT 25`,
  ).bind(now - 3 * 60_000, now - 3 * 86_400_000).all<{ tran_id: string; gateway_ref: string; created_at: number }>();
  if (!results.length) return out;
  const t = await token(c);
  if (!t) return out;
  for (const o of results) {
    out.checked++;
    const q = await post(`${c.base}/tokenized/checkout/payment/status`, authHeaders(c, t), { paymentID: o.gateway_ref });
    logReply('reconcile', o.tran_id, q);
    if (matches(q, o.tran_id, o.gateway_ref)) {
      await fulfilOrder(o.tran_id, { bankTranId: q!.trxID, validationId: o.gateway_ref, gatewayStatus: 'Completed (reconciled)' }, origin);
      out.paid++;
    } else if (q?.transactionStatus && !['Initiated', 'Pending Authorized', 'Completed'].includes(q.transactionStatus)) {
      await markOrder(o.tran_id, 'failed', `reconcile ${q.transactionStatus}`);
      out.failed++;
    } else if (q?.transactionStatus === 'Initiated' && now - o.created_at > 86_400_000) {
      // Never approved. bKash expires these; after a day, close the order too.
      await markOrder(o.tran_id, 'cancelled', 'reconcile never approved');
      out.failed++;
    }
  }
  return out;
}
