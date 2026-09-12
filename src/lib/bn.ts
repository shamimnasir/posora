const DIGITS = '০১২৩৪৫৬৭৮৯';
/** Latin digits → Bangla digits. Leaves everything else untouched. */
export const bn = (v: string | number): string => String(v).replace(/\d/g, (d) => DIGITS[+d]);
/** Zero-padded two-digit Bangla ordinal, e.g. 3 → "০৩". */
export const pad2 = (n: number): string => bn(String(n).padStart(2, '0'));
/** Bangla thousands grouping: 384400 → "৩,৮৪,৪০০" (South Asian grouping). */
export const bnNum = (n: number): string => bn(new Intl.NumberFormat('en-IN').format(n));

/**
 * A big number the way Bangla says it: লাখ and কোটি rather than a wall of
 * digits. Lives here rather than inside the space explorer's script because
 * the page now renders these numbers on the server too, and one copy is the
 * only way the two can agree.
 */
export function bnBig(n: number): string {
  if (n >= 1e7) return `${bn((n / 1e7).toFixed(n >= 1e8 ? 0 : 1))} কোটি`;
  if (n >= 1e5) return `${bn((n / 1e5).toFixed(n >= 1e6 ? 0 : 1))} লাখ`;
  if (n >= 1000) return bnNum(Math.round(n));
  if (n >= 10) return bn(Math.round(n));
  return bn(n.toFixed(1));
}

/** A span of hours in the largest unit that still reads naturally. */
export function bnDuration(hours: number): string {
  if (hours * 3600 < 90) return `${bn((hours * 3600).toFixed(1))} সেকেন্ড`;
  if (hours < 1) return `${bn(Math.round(hours * 60))} মিনিট`;
  if (hours < 48) return `${bn(hours.toFixed(1))} ঘণ্টা`;
  const days = hours / 24;
  if (days < 365) return `${bn(Math.round(days))} দিন`;
  const years = days / 365;
  return years >= 1000 ? `${bnBig(years)} বছর` : `${bn(Math.round(years))} বছর`;
}
