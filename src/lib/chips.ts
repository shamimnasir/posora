/**
 * The two or three short tags under an item's name.
 *
 * Chips were written as a standalone list of what to say about an item, so the
 * first one is very often the item's own name: 55 of রসায়ন's 77 items printed
 * "কঠিন · কঠিন · আকার ধরে রাখে". Beside a heading that already says কঠিন that
 * is not a tag, it is an echo - and it is the reason half the cards in the
 * index wrapped onto a second line while the others did not, which is what
 * made the grid look ragged.
 *
 * `worksheet.ts` has always skipped a chip matching the item, because a
 * matching pair whose two halves are the same word is not a question. This is
 * the same rule, applied everywhere the chips are shown next to the name.
 */
export const chipsFor = (chips: readonly string[], item: string, take = chips.length): string[] =>
  chips.filter((c) => c.trim() !== item.trim()).slice(0, take);
