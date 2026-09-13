const DIGITS = '০১২৩৪৫৬৭৮৯';
/** Latin digits → Bangla digits. Leaves everything else untouched. */
export const bn = (v: string | number): string => String(v).replace(/\d/g, (d) => DIGITS[+d]);
/**
 * Bangla case endings, which depend on the letter the name ends in.
 *
 * A name ending in a vowel takes -র and -তে; one ending in a consonant takes
 * -ের and -ে. Sticking one form on regardless is how the space pages came to
 * offer "শনিের পুরো পাতা" and "পৃথিবীের থ্রিডি মডেল", and how the world pages
 * described "ভাষাের বিভাগ": four of the eleven bodies and three of the eleven
 * worlds are named with a final vowel, and ীের is not a thing anyone writes.
 */
const VOWEL_END = /[অআইঈউঊঋএঐওঔািীুূৃেৈোৌ]$/;
/**
 * Khanda ta is a consonant with the vowel cut off it, so it cannot carry one:
 * before any vowel ending it reverts to the full ত. জগৎ + এর is জগতের, and
 * "উদ্ভিদ ও প্রাণিজগৎের" is what the naive rule produces for one of the worlds.
 */
const stem = (name: string): string => name.replace(/ৎ$/, 'ত');
/** Possessive: শনি → শনির, বুধ → বুধের, প্রাণিজগৎ → প্রাণিজগতের. */
export const bnOf = (name: string): string => `${stem(name)}${VOWEL_END.test(name) ? 'র' : 'ের'}`;
/** Locative: পৃথিবী → পৃথিবীতে, বুধ → বুধে, প্রাণিজগৎ → প্রাণিজগতে. */
export const bnAt = (name: string): string => `${stem(name)}${VOWEL_END.test(name) ? 'তে' : 'ে'}`;

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
