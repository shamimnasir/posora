/**
 * The weekly letter to the adult.
 *
 * This is not a marketing email and it is not a report card. It exists because
 * পসরা has exactly one way to reach a household: a website cannot notify a
 * child, and should not try. Everything else on the site waits for someone to
 * come back on their own. This is the one thing that goes out.
 *
 * So it has to be worth opening. It says what happened, in numbers the parent
 * can check, and then it hands them one thing to say at dinner. The dinner
 * question is the part that does the work: it turns a screen the child used
 * alone into a conversation, which is the thing parents actually want and the
 * reason a family plan gets renewed.
 *
 * Rules it keeps:
 *  - only what the child's own devices already recorded, nothing new collected
 *  - no child's name is compared to another family's anything
 *  - a quiet week says so plainly rather than inventing encouragement
 *  - one link, to the family's own page, and an unsubscribe line that is true
 */
import type { WeekRow } from './members';
import { bn } from './bn';
import { dhakaDay, dayLabel } from './daily';
import { pick, shuffled } from './rand';

export type Letter = { subject: string; text: string; html: string };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/**
 * One thing to ask at the table, chosen from the worlds the child actually
 * opened this week, so it is never a question about something they did not see.
 */
const ASKS: Record<string, string[]> = {
  space: ['কোন গ্রহে দাঁড়ালে তোমার ওজন সবচেয়ে কম হতো?', 'সূর্যের আলো আমাদের কাছে আসতে কত সময় লাগে?', 'চাঁদ রোজ একটু একটু করে বদলায় কেন?'],
  math: ['দোকানে একশো টাকার নোট দিলে কত ফেরত পাওয়ার কথা, মাথায় হিসাব করো তো?', 'ঘরের কোন জিনিসটা এক মিটারের কাছাকাছি লম্বা?', 'তোমার প্রিয় সংখ্যাটা কেন প্রিয়?'],
  physics: ['সাইকেল থামাতে ব্রেক কীভাবে কাজ করে?', 'ছাদ থেকে পালক আর পাথর একসঙ্গে ফেললে কী হবে, আর কেন?', 'আয়নায় লেখা উল্টো দেখায় কেন?'],
  chemistry: ['জলে চিনি মেশালে চিনিটা কোথায় যায়?', 'লোহায় জং ধরে কেন, আর ঠেকানো যায় কীভাবে?', 'রান্নায় বেকিং সোডা কী করে?'],
  life: ['আমাদের চারপাশের কোন গাছটা সবচেয়ে বেশি বয়সী মনে হয় তোমার?', 'ইলিশ কোথায় ডিম পাড়ে, জানো?', 'সুন্দরবনের গাছ নোনা জলে টেকে কীভাবে?'],
  nature: ['এই মাসে আকাশ কেমন, বর্ষা না শীত? কী করে বুঝলে?', 'আমাদের বাসার পানি কোথা থেকে আসে?', 'নদী বাঁক নেয় কেন?'],
  food: ['আজকের খাবারে কোন ছয়টা উপাদানের কোনটা কোনটা ছিল?', 'ভাত রান্না হলে শক্ত চাল নরম হয় কেন?', 'কোন মশলাটা ছাড়া তোমার প্রিয় রান্নাটা হবেই না?'],
  money: ['এক হাজার টাকা পেলে কত রাখতে আর কত খরচ করতে?', 'ব্যাংক টাকা রেখে কী করে?', 'দাম বেড়ে যায় মানে কী?'],
  language: ['আজ নতুন কোন শব্দ শিখেছ?', '"বড়" শব্দের উল্টো কী কী হতে পারে?', 'একই কথা আদর করে আর রেগে বললে কেমন শোনায়?'],
  social: ['কেউ কিছু চাইলে "না" বলা কখন ঠিক?', 'বন্ধুর সঙ্গে ঝগড়া হলে তুমি কী করো?', 'অচেনা কেউ অনলাইনে কথা বললে কী করবে?'],
  discovery: ['কোন আবিষ্কারটা না হলে আজকের দিনটা সবচেয়ে কঠিন হতো?', 'বাড়িতে কী দিয়ে একটা পরীক্ষা করে দেখা যায়?', 'কোন বাঙালি বিজ্ঞানীর কথা তোমার মনে আছে?'],
};

/** A question about something this child actually opened, or a general one. */
function askFor(row: WeekRow, seed: string): string {
  for (const w of row.worlds) {
    const list = ASKS[w];
    if (list?.length) return pick(list, `${seed}:${row.childId}:${w}`)!;
  }
  return pick(
    ['এই সপ্তাহে নতুন কী শিখলে?', 'পসরায় কোন জিনিসটা সবচেয়ে অবাক করেছে?', 'কোন ভুবনটা তোমার সবচেয়ে ভালো লাগে, আর কেন?'],
    `${seed}:${row.childId}`,
  )!;
}

/** "৩ দিন, ১২টি নতুন জিনিস" and so on, or an honest blank. */
function line(row: WeekRow, worldName: (slug: string) => string): string {
  if (row.items === 0 && row.quizzes === 0) return 'এই সপ্তাহে কিছু খোলা হয়নি।';
  const bits: string[] = [];
  if (row.days) bits.push(`${bn(row.days)} দিন`);
  if (row.items) bits.push(`${bn(row.items)}টি নতুন জিনিস`);
  if (row.quizzes) bits.push(`${bn(row.quizzes)}টি যাচাই, ${bn(row.passed)}টি পাশ`);
  const where = row.worlds.slice(0, 3).map(worldName).join(', ');
  if (where) bits.push(`ঘুরেছে: ${where}`);
  return bits.join(' · ');
}

/**
 * Build the letter. Returns null when there is nothing to say at all, because
 * a weekly email that arrives to report that nothing happened, week after
 * week, is the reason people mute a sender.
 */
export function buildLetter(
  rows: WeekRow[],
  opts: { origin: string; worldName: (slug: string) => string; day?: string },
): Letter | null {
  const live = rows.filter((r) => r.items > 0 || r.quizzes > 0);
  if (!live.length) return null;

  const day = opts.day ?? dhakaDay();
  const seed = `letter:${day}`;
  const totalItems = rows.reduce((n, r) => n + r.items, 0);
  const bestDays = rows.reduce((n, r) => Math.max(n, r.days), 0);
  const names = live.map((r) => r.nickname);

  const subject = live.length === 1
    ? `${names[0]} এই সপ্তাহে ${bn(live[0]!.items)}টি নতুন জিনিস দেখেছে`
    : `পসরায় এই সপ্তাহ: ${bn(totalItems)}টি নতুন জিনিস`;

  const head = live.length === 1
    ? `${names[0]} এই সপ্তাহে ${bn(bestDays)} দিন পসরায় এসেছে।`
    : `${names.join(', ')} মিলে এই সপ্তাহে ${bn(totalItems)}টি নতুন জিনিস খুলে দেখেছে।`;

  /* ---- plain text, which is the version that always arrives ---- */
  const lines = [
    `পসরা · সপ্তাহের খবর · ${dayLabel(day)}`,
    '',
    head,
    '',
  ];
  for (const r of rows) {
    lines.push(`${r.nickname}: ${line(r, opts.worldName)}`);
  }
  lines.push('', 'রাতের খাবারে জিজ্ঞেস করে দেখতে পারেন:');
  for (const r of live) lines.push(`  ${r.nickname}কে: ${askFor(r, seed)}`);
  lines.push(
    '',
    `পুরো হিসাব: ${opts.origin}/account/`,
    '',
    'এই চিঠি সপ্তাহে একবার যায়, শুধু যে সপ্তাহে সত্যিই কিছু হয়েছে।',
    'বন্ধ করতে চাইলে এই মেইলের উত্তরে "বন্ধ" লিখে পাঠালেই হবে।',
  );

  /* ---- html, same words ---- */
  const row = (r: WeekRow) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e3e9f0;vertical-align:top">
        <b style="font-size:15px;color:#111820">${esc(r.nickname)}</b><br>
        <span style="font-size:14px;color:#3c4854">${esc(line(r, opts.worldName))}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #e3e9f0;text-align:right;vertical-align:top;white-space:nowrap">
        <b style="font-size:22px;color:#15544c">${esc(bn(r.items))}</b>
        <span style="font-size:12px;color:#6b7987"><br>নতুন</span>
      </td>
    </tr>`;

  const html = `<!doctype html><html lang="bn"><body style="margin:0;background:#e9edf2;font-family:'Noto Sans Bengali',system-ui,sans-serif;line-height:1.7">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6b7987">পসরা · সপ্তাহের খবর</p>
    <p style="margin:0 0 18px;font-size:13px;color:#6b7987">${esc(dayLabel(day))}</p>
    <div style="background:#fcfdfe;border:1px solid #e3e9f0;border-radius:16px;padding:20px 22px">
      <p style="margin:0 0 16px;font-size:17px;color:#111820">${esc(head)}</p>
      <table style="width:100%;border-collapse:collapse">${rows.map(row).join('')}</table>
      <p style="margin:22px 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6b7987">রাতের খাবারে জিজ্ঞেস করে দেখুন</p>
      ${live.map((r) => `<p style="margin:0 0 10px;font-size:15px;color:#111820;background:#dcefe9;border-radius:10px;padding:10px 12px">
        <b>${esc(r.nickname)}কে:</b> ${esc(askFor(r, seed))}</p>`).join('')}
      <p style="margin:20px 0 0"><a href="${esc(opts.origin)}/account/" style="display:inline-block;background:#15544c;color:#f4fbf9;text-decoration:none;padding:11px 20px;border-radius:999px;font-weight:700;font-size:15px">পুরো হিসাব দেখুন</a></p>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:#6b7987">
      এই চিঠি সপ্তাহে একবার যায়, শুধু যে সপ্তাহে সত্যিই কিছু হয়েছে।
      বন্ধ করতে চাইলে এই মেইলের উত্তরে "বন্ধ" লিখে পাঠালেই হবে।
    </p>
  </div>
</body></html>`;

  return { subject, text: lines.join('\n'), html };
}

/** Deterministic order for a digest run, so a retry sends the same thing. */
export const letterOrder = <T,>(list: readonly T[], day = dhakaDay()): T[] => shuffled(list, `letters:${day}`);
