/**
 * Small, server-only SSLCommerz adapter.
 *
 * Credentials are read from Worker secrets. The browser never sees a store
 * password and the price is selected from our order, not from a form field.
 * The callbacks and IPN both come through `settlePayment`, which validates the
 * transaction with SSLCommerz before anything is marked paid.
 */
import { ensureMember, grantEntitlement, PLAN_DIGITAL_PACK } from './members';
import { db, dbEnv, requireDb } from './db';

export const DIGITAL_PACK_SLUG = 'all-worlds-digital-pack';
export const DIGITAL_PACK_AMOUNT = 249;
export const DIGITAL_PACK_CURRENCY = 'BDT';

type Config = { storeId: string; storePassword: string; base: string };
type GatewayResponse = { status?: string; failedreason?: string; GatewayPageURL?: string; sessionkey?: string };
type ValidationResponse = {
  status?: string;
  tran_id?: string;
  amount?: string | number;
  currency?: string;
  risk_level?: string | number;
  val_id?: string;
  bank_tran_id?: string;
};

const text = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
const json = (v: string): Record<string, unknown> | null => {
  try { return JSON.parse(v) as Record<string, unknown>; } catch { return null; }
};

export const configured = (): boolean => {
  const e = dbEnv();
  return !!e.SSLCOMMERZ_STORE_ID && !!e.SSLCOMMERZ_STORE_PASSWORD;
};

/** A separate release switch prevents charging before the files exist. */
export const digitalPackReady = (): boolean => dbEnv().DIGITAL_PACK_READY === 'true';
export const checkoutReady = (): boolean => configured() && digitalPackReady();

function config(): Config | null {
  const e = dbEnv();
  if (!e.SSLCOMMERZ_STORE_ID || !e.SSLCOMMERZ_STORE_PASSWORD) return null;
  return {
    storeId: e.SSLCOMMERZ_STORE_ID,
    storePassword: e.SSLCOMMERZ_STORE_PASSWORD,
    base: e.SSLCOMMERZ_MODE === 'live' ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com',
  };
}

export const newTranId = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const suffix = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `POSORA${Date.now().toString(36).slice(-8)}${suffix}`.slice(0, 30);
};

export type CheckoutInput = { name: string; email: string; phone: string; address: string; origin: string };
export type CheckoutResult =
  | { ok: true; tranId: string; gatewayUrl: string }
  | { ok: false; error: 'unavailable' | 'invalid' | 'gateway-failed' };

export async function initiateCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const cfg = config();
  const d = db();
  if (!cfg || !d || !digitalPackReady()) return { ok: false, error: 'unavailable' };
  const name = text(input.name, 100), email = text(input.email, 254).toLowerCase();
  const phone = text(input.phone, 24), address = text(input.address, 120);
  if (name.length < 2 || !/^\S+@\S+\.\S{2,}$/.test(email) || phone.replace(/\D/g, '').length < 6) return { ok: false, error: 'invalid' };

  const tranId = newTranId(), now = Date.now();
  await d.prepare(
    `INSERT INTO orders (id, tran_id, product_slug, amount_bdt, currency, customer_name, customer_email, customer_phone, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
  ).bind(crypto.randomUUID(), tranId, DIGITAL_PACK_SLUG, DIGITAL_PACK_AMOUNT, DIGITAL_PACK_CURRENCY, name, email, phone, now, now).run();

  const form = new URLSearchParams({
    store_id: cfg.storeId,
    store_passwd: cfg.storePassword,
    total_amount: DIGITAL_PACK_AMOUNT.toFixed(2),
    currency: DIGITAL_PACK_CURRENCY,
    tran_id: tranId,
    product_category: 'education',
    product_name: 'Posora 11-world digital pack bundle',
    product_profile: 'general',
    success_url: `${input.origin}/api/sslcommerz/success`,
    fail_url: `${input.origin}/api/sslcommerz/fail`,
    cancel_url: `${input.origin}/api/sslcommerz/cancel`,
    ipn_url: `${input.origin}/api/sslcommerz/ipn`,
    cus_name: name,
    cus_email: email,
    cus_phone: phone,
    cus_add1: address || 'Bangladesh',
    cus_city: 'Dhaka',
    cus_country: 'Bangladesh',
    shipping_method: 'NO',
    num_of_item: '1',
    value_a: DIGITAL_PACK_SLUG,
  });

  try {
    const response = await fetch(`${cfg.base}/gwprocess/v4/api.php`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form,
    });
    const body = json(await response.text()) as GatewayResponse | null;
    if (!response.ok || body?.status !== 'SUCCESS' || !body.GatewayPageURL) {
      await d.prepare("UPDATE orders SET status = 'failed', gateway_status = ?, updated_at = ? WHERE tran_id = ?")
        .bind(text(body?.failedreason ?? `HTTP ${response.status}`, 200), Date.now(), tranId).run();
      return { ok: false, error: 'gateway-failed' };
    }
    await d.prepare('UPDATE orders SET ssl_session_key = ?, updated_at = ? WHERE tran_id = ?')
      .bind(text(body.sessionkey, 80) || null, Date.now(), tranId).run();
    return { ok: true, tranId, gatewayUrl: body.GatewayPageURL };
  } catch (err) {
    console.error('SSLCommerz initiation failed', err);
    await d.prepare("UPDATE orders SET status = 'failed', gateway_status = ?, updated_at = ? WHERE tran_id = ?")
      .bind('network-error', Date.now(), tranId).run();
    return { ok: false, error: 'gateway-failed' };
  }
}

async function validate(valId: string): Promise<ValidationResponse | null> {
  const cfg = config();
  if (!cfg || !valId) return null;
  const u = new URL(`${cfg.base}/validator/api/validationserverAPI.php`);
  u.search = new URLSearchParams({ val_id: valId, store_id: cfg.storeId, store_passwd: cfg.storePassword, format: 'json' }).toString();
  try {
    const response = await fetch(u);
    return json(await response.text()) as ValidationResponse | null;
  } catch (err) {
    console.error('SSLCommerz validation failed', err);
    return null;
  }
}

export type SettleResult = 'paid' | 'held' | 'failed' | 'ignored';

/** Validate and settle a callback or IPN. Safe to call repeatedly. */
export async function settlePayment(payload: Record<string, unknown>): Promise<SettleResult> {
  const d = db();
  if (!d || !configured()) return 'failed';
  const tranId = text(payload.tran_id, 40), valId = text(payload.val_id, 80);
  if (!tranId || !valId) return 'failed';
  const order = await d.prepare('SELECT * FROM orders WHERE tran_id = ?').bind(tranId).first<{
    tran_id: string; product_slug: string; member_id: string | null; amount_bdt: number; currency: string;
    customer_name: string; customer_email: string; status: string;
  }>();
  if (!order || order.product_slug !== DIGITAL_PACK_SLUG) return 'failed';
  if (order.status === 'paid' || order.status === 'held') return order.status;

  const remote = await validate(valId);
  const amount = Number(remote?.amount);
  const valid = remote?.status === 'VALID' || remote?.status === 'VALIDATED';
  if (!valid || remote?.tran_id !== tranId || remote?.currency !== order.currency || !Number.isFinite(amount) || Math.abs(amount - order.amount_bdt) > 0.001) {
    await d.prepare("UPDATE orders SET status = 'failed', validation_id = ?, gateway_status = ?, updated_at = ? WHERE tran_id = ? AND status = 'pending'")
      .bind(valId, text(remote?.status ?? payload.status, 40) || 'invalid', Date.now(), tranId).run();
    return 'failed';
  }

  const risk = String(remote?.risk_level ?? payload.risk_level ?? '0') === '1';
  const status = risk ? 'held' : 'paid';
  // Risk-reviewed payments stay held until a manual review. For a normal
  // payment, grant the entitlement before marking the order paid so a
  // transient member/database error cannot create a paid-but-unentitled
  // order. Both the grant and callback are idempotent, so retries are safe.
  let memberId: string | null = null;
  if (!risk) {
    memberId = order.member_id ?? await ensureMember(order.customer_email, order.customer_name);
    await grantEntitlement(memberId, PLAN_DIGITAL_PACK, null, `SSLCommerz ${tranId}`, 'sslcommerz');
  }
  await d.prepare(
    `UPDATE orders SET status = ?, validation_id = ?, bank_tran_id = ?, gateway_status = ?, updated_at = ?, paid_at = ?
     WHERE tran_id = ? AND status = 'pending'`,
  ).bind(status, valId, text(remote?.bank_tran_id ?? payload.bank_tran_id, 80) || null, text(remote?.status, 40), Date.now(), risk ? null : Date.now(), tranId).run();
  if (risk) return 'held';

  await d.prepare('UPDATE orders SET member_id = ?, updated_at = ? WHERE tran_id = ?').bind(memberId, Date.now(), tranId).run();
  return 'paid';
}

export async function markCallback(tranId: string, status: 'failed' | 'cancelled'): Promise<void> {
  const d = db();
  if (!d || !tranId) return;
  await d.prepare("UPDATE orders SET status = ?, gateway_status = ?, updated_at = ? WHERE tran_id = ? AND status = 'pending'")
    .bind(status, status.toUpperCase(), Date.now(), tranId).run();
}

export const orderFor = async (tranId: string) => {
  if (!tranId) return null;
  return requireDb().prepare('SELECT tran_id, status, customer_email, amount_bdt, currency FROM orders WHERE tran_id = ?').bind(tranId)
    .first<{ tran_id: string; status: string; customer_email: string; amount_bdt: number; currency: string }>();
};
