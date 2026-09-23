import type { Cell } from '../units/Cell.js';

/** A widget's size, in literal grid cells — no named vocabulary, no lookup. */
export interface Size {
  readonly w: Cell;
  readonly h: Cell;
}

export function sizesEqual(a: Size, b: Size): boolean {
  return a.w === b.w && a.h === b.h;
}

// True when `size` matches one of a widget manifest's declared sizes.
export function isSizeAllowed(size: Size, allowed: readonly Size[]): boolean {
  return allowed.some((candidate) => sizesEqual(candidate, size));
}
