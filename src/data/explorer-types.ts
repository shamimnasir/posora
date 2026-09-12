/** Shared shape for every world's per-item "more info" dataset (chips, three
 * reading depths, one fun fact) - mirrors the space explorer's Body fields. */
export type ItemDetail = { chips: string[]; l1: string; l2: string; l3: string; fun: string };
