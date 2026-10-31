/**
 * The one thing পসরা sells today - the all-downloads bundle - and the order
 * ledger both payment rails share.
 *
 * bKash and SSLCommerz differ only in how a payment is started and verified.
 * Once a rail has verified the money server-to-server it calls `fulfilOrder`,
 * which grants the entitlement, marks the order paid and mails the receipt.
 * Every step is idempotent, because a buyer can reload a callback page.
 *
 * Instant download: each order carries a random `download_key`. It appears
 * only in the buyer's own confirmation URL and receipt email, and opens that
 * order's files for DOWNLOAD_KEY_DAYS. It is not a sign-in. After that the
 * files stay in the buyer's account, reached by the usual email code.
 */
import { env } from 'cloudflare:workers';
import { ensureMember, grantEntitlement, PLAN_DIGITAL_PACK } from './members';
import { db, dbEnv, requireDb } from './db';
import { bn } from './bn';

export const DIGITAL_PACK_SLUG = 'all-worlds-digital-pack';
export const DIGITAL_PACK_AMOUNT = 249;
export const DIGITAL_PACK_CURRENCY = 'BDT';
export const DOWNLOAD_KEY_DAYS = 30;

export type Gateway = 'bkash' | 'sslcommerz';

export const bkashConfigured = (): boolean => {
  const e = dbEnv();
  return !!e.BKASH_USERNAME && !!e.BKASH_PASSWORD && !!e.BKASH_APP_KEY && !!e.BKASH_APP_SECRET;
};
export const sslcommerzConfigured = (): boolean => {
  const e = dbEnv();
  return !!e.SSLCOMMERZ_STORE_ID && !!e.SSLCOMMERZ_STORE_PASSWORD;
};

/** A separate release switch prevents charging before the files exist. */
export const digitalPackReady = (): boolean => dbEnv().DIGITAL_PACK_READY === 'true';

/** Rails that can take real money right now, in the order the checkout offers them. */
export function liveGateways(): Gateway[] {
  const e = dbEnv();
  const out: Gateway[] = [];
  if (bkashConfigured() && e.BKASH_MODE === 'live') out.push('bkash');
  if (sslcommerzConfigured() && e.SSLCOMMERZ_MODE === 'live') out.push('sslcommerz');
  return out;
}

/** Rails that can start a checkout at all, sandbox included. */
export function usableGateways(): Gateway[] {
  const out: Gateway[] = [];
  if (bkashConfigured()) out.push('bkash');
  if (sslcommerzConfigured()) out.push('sslcommerz');
  return out;
}

/** Real money changes hands only in live mode; public copy about selling follows this. */
export const digitalPackOnSale = (): boolean => digitalPackReady() && liveGateways().length > 0;

const text = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export const newTranId = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const suffix = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `POSORA${Date.now().toString(36).slice(-8)}${suffix}`.slice(0, 30);
};

const newKey = (): string => [...crypto.getRandomValues(new Uint8Array(20))].map((b) => b.toString(16).padStart(2, '0')).join('');

export type BuyerInput = { name: string; email: string; phone: string };
export type Buyer = BuyerInput;

/** Clean and check what the checkout form sent; null when it cannot be used. */
export function cleanBuyer(input: BuyerInput): Buyer | null {
  const name = text(input.name, 100), email = text(input.email, 254).toLowerCase();
  // Bangla digits typed on a phone keyboard are still a phone number.
  const phone = text(input.phone, 24).replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
  if (name.length < 2 || !/^\S+@\S+\.\S{2,}$/.test(email) || phone.replace(/\D/g, '').length < 6) return null;
  return { name, email, phone };
}

/** Open a pending order and return its id and the buyer's download key. */
export async function createOrder(buyer: Buyer, gateway: Gateway): Promise<{ tranId: string; key: string }> {
  const tranId = newTranId(), key = newKey(), now = Date.now();
  await requireDb().prepare(
    `INSERT INTO orders (id, tran_id, product_slug, amount_bdt, currency, customer_name, customer_email, customer_phone, status, gateway, download_key, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
  ).bind(crypto.randomUUID(), tranId, DIGITAL_PACK_SLUG, DIGITAL_PACK_AMOUNT, DIGITAL_PACK_CURRENCY, buyer.name, buyer.email, buyer.phone, gateway, key, now, now).run();
  return { tranId, key };
}

export type OrderRow = {
  tran_id: string; product_slug: string; member_id: string | null; amount_bdt: number; currency: string;
  customer_name: string; customer_email: string; status: string; gateway: string; gateway_ref: string | null;
  download_key: string | null; paid_at: number | null; bank_tran_id: string | null;
};

export const orderByTran = (tranId: string) =>
  requireDb().prepare('SELECT * FROM orders WHERE tran_id = ?').bind(tranId).first<OrderRow>();

export async function markOrder(tranId: string, status: 'failed' | 'cancelled', gatewayStatus: string): Promise<void> {
  const d = db();
  if (!d || !tranId) return;
  await d.prepare("UPDATE orders SET status = ?, gateway_status = ?, updated_at = ? WHERE tran_id = ? AND status = 'pending'")
    .bind(status, text(gatewayStatus, 60) || status.toUpperCase(), Date.now(), tranId).run();
}

/**
 * Grant the bundle and mark a verified order paid. Call only after the rail
 * has confirmed the amount and currency with the gateway itself.
 * The entitlement is granted before the order flips to paid, so a database
 * hiccup can leave a pending-but-entitled order (harmless, and retried) but
 * never a paid-but-unentitled one.
 */
export async function fulfilOrder(tranId: string, proof: { bankTranId?: string | null; validationId?: string | null; gatewayStatus: string }, origin: string): Promise<'paid'> {
  const d = requireDb();
  const order = await orderByTran(tranId);
  if (!order) throw new Error(`fulfilOrder: no order ${tranId}`);
  if (order.status === 'paid') return 'paid';
  const memberId = order.member_id ?? await ensureMember(order.customer_email, order.customer_name);
  await grantEntitlement(memberId, PLAN_DIGITAL_PACK, null, `${order.gateway} ${tranId}`, order.gateway);
  const now = Date.now();
  const res = await d.prepare(
    `UPDATE orders SET status = 'paid', member_id = ?, bank_tran_id = COALESCE(?, bank_tran_id), validation_id = COALESCE(?, validation_id),
       gateway_status = ?, updated_at = ?, paid_at = ? WHERE tran_id = ? AND status IN ('pending', 'held')`,
  ).bind(memberId, text(proof.bankTranId, 80) || null, text(proof.validationId, 80) || null, text(proof.gatewayStatus, 40), now, now, tranId).run();
  // Only the request that actually flipped the order sends the receipt.
  if (Number(res.meta?.changes ?? 0) > 0) await sendReceipt({ ...order, paid_at: now, bank_tran_id: text(proof.bankTranId, 80) || order.bank_tran_id }, origin).catch((err) => console.error('receipt email failed', err));
  return 'paid';
}

/** The order a download key opens, while it is paid and the key is fresh. */
export async function orderForKey(tranId: string, key: string): Promise<OrderRow | null> {
  if (!/^[A-Za-z0-9]{6,40}$/.test(tranId) || !/^[0-9a-f]{40}$/.test(key)) return null;
  const order = await orderByTran(tranId).catch(() => null);
  if (!order || order.status !== 'paid' || !order.download_key || !order.paid_at) return null;
  if (!timingSafeEqual(order.download_key, key)) return null;
  if (Date.now() - order.paid_at > DOWNLOAD_KEY_DAYS * 86_400_000) return null;
  return order;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const confirmationUrl = (origin: string, tranId: string, key?: string | null, status = 'success') => {
  const u = new URL('/digital-pack/confirmation/', origin);
  u.searchParams.set('status', status);
  u.searchParams.set('tran_id', tranId);
  if (key) u.searchParams.set('k', key);
  return u.toString();
};

type MailEnv = {
  EMAIL?: { send(msg: { to: string; from: { email: string; name: string }; subject: string; text: string; html: string }): Promise<unknown> };
  CONTACT_FROM?: string;
};

async function sendReceipt(order: OrderRow, origin: string): Promise<void> {
  const mail = env as unknown as MailEnv;
  if (!mail.EMAIL) return;
  const link = confirmationUrl(origin, order.tran_id, order.download_key);
  const via = order.gateway === 'bkash' ? 'বিকাশ' : 'SSLCommerz';
  const lines = [
    `${order.customer_name}, ধন্যবাদ! আপনার পসরা সব-ডাউনলোড বান্ডলের পেমেন্ট (৳${bn(order.amount_bdt)}, ${via}) যাচাই হয়েছে।`,
    '',
    `এই লিংক থেকে এখনই সব ফাইল নামাতে পারবেন (${bn(DOWNLOAD_KEY_DAYS)} দিন কাজ করবে):`,
    link,
    '',
    `পরে যেকোনো সময় ${origin}/account/ পাতায় এই ইমেইল (${order.customer_email}) দিয়ে ঢুকলে আবার ডাউনলোড করা যাবে।`,
    '',
    `অর্ডার: ${order.tran_id}${order.bank_tran_id ? ` · ট্রানজেকশন: ${order.bank_tran_id}` : ''}`,
    'কোনো সমস্যা হলে এই অর্ডার নম্বরসহ support@posora.com-এ লিখুন।',
  ];
  const esc = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const html = `<!doctype html><html lang="bn"><body style="margin:0;background:#e9edf2;font-family:'Noto Sans Bengali',system-ui,sans-serif;line-height:1.7">
  <div style="max-width:520px;margin:0 auto;padding:24px 16px">
    <div style="background:#fcfdfe;border:1px solid #e3e9f0;border-radius:16px;padding:22px">
      <p style="margin:0 0 6px;font-size:12px;color:#6b7987">পসরা · পেমেন্টের রসিদ</p>
      <p style="margin:0 0 14px;font-size:22px;font-weight:800;color:#111820">আপনার ডাউনলোড তৈরি</p>
      <p style="margin:0 0 18px;font-size:15px;color:#3c4854">${esc(lines[0]!)}</p>
      <p style="margin:0 0 18px"><a href="${esc(link)}" style="display:inline-block;background:#15544c;color:#f4fbf9;text-decoration:none;padding:11px 20px;border-radius:999px;font-weight:700;font-size:15px">সব ফাইল ডাউনলোড করো</a></p>
      <p style="margin:0 0 8px;font-size:13px;color:#6b7987">লিংকটি ${bn(DOWNLOAD_KEY_DAYS)} দিন কাজ করবে। পরে <a href="${origin}/account/">অ্যাকাউন্ট</a> পাতায় ${esc(order.customer_email)} দিয়ে ঢুকলেও ফাইলগুলো পাবেন।</p>
      <p style="margin:0;font-size:12px;color:#6b7987;font-family:ui-monospace,Menlo,monospace">${esc(lines[7]!)}</p>
    </div>
  </div>
</body></html>`;
  await mail.EMAIL.send({
    to: order.customer_email,
    from: { email: mail.CONTACT_FROM ?? 'no-reply@posora.com', name: 'পসরা' },
    subject: 'পসরা: আপনার ডাউনলোড তৈরি',
    text: lines.join('\n'),
    html,
  });
}
