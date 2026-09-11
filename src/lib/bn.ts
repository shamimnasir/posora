const DIGITS = '০১২৩৪৫৬৭৮৯';
/** Latin digits → Bangla digits. Leaves everything else untouched. */
export const bn = (v: string | number): string => String(v).replace(/\d/g, (d) => DIGITS[+d]);
/** Zero-padded two-digit Bangla ordinal, e.g. 3 → "০৩". */
export const pad2 = (n: number): string => bn(String(n).padStart(2, '0'));
/** Bangla thousands grouping: 384400 → "৩,৮৪,৪০০" (South Asian grouping). */
export const bnNum = (n: number): string => bn(new Intl.NumberFormat('en-IN').format(n));
