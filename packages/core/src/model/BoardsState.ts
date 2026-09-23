import type { Board } from './Board.js';
import type { LayoutTile } from './LayoutTile.js';
import { STATE_VERSION } from './StateVersion.js';

declare const validState: unique symbol;

/** A whole boards document: every page's tiles, plus other breakpoints' saved layouts. */
export interface BoardsState {
  readonly [validState]: true;
  readonly version: typeof STATE_VERSION;
  readonly grid: { readonly cols: number; readonly rows: number };
  readonly boards: readonly Board[];
  // Other breakpoints' saved positions, keyed by grid ("6x4"); reflow reads and writes these.
  readonly layouts: Readonly<Record<string, readonly LayoutTile[]>>;
}

export interface ValidCandidate {
  readonly grid: { readonly cols: number; readonly rows: number };
  readonly boards: readonly Board[];
  readonly layouts?: Readonly<Record<string, readonly LayoutTile[]>>;
}

// Applies the brand; caller must have run validateState first.
export function markValid(candidate: ValidCandidate): BoardsState {
  return { version: STATE_VERSION, grid: candidate.grid, boards: candidate.boards, layouts: candidate.layouts ?? {} } as BoardsState;
}
