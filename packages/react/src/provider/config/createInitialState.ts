import type { BoardsState } from 'boardkit-core';
import type { BoardsConfig } from './BoardsConfig.js';
import type { InitialLayoutTile } from './InitialLayoutTile.js';
import type { InitialPlacementCtx } from './InitialPlacementCtx.js';
import { placeAutoLayout } from './placeAutoLayout.js';
import { placePinnedLayout } from './placePinnedLayout.js';

interface SplitEntries {
  readonly auto: readonly InitialLayoutTile[];
  readonly pinned: readonly InitialLayoutTile[];
}

function splitEntries(entries: readonly InitialLayoutTile[]): SplitEntries {
  return { auto: entries.filter((entry) => entry.page === undefined), pinned: entries.filter((entry) => entry.page !== undefined) };
}

/** Pure builder for the state an uncontrolled `BoardProvider` starts from, using `config.initialLayout`. */
export function createInitialState(config: BoardsConfig): BoardsState {
  const ctx: InitialPlacementCtx = { config, counts: new Map() };
  const { auto, pinned } = splitEntries(config.initialLayout ?? []);
  const { state, pages } = placeAutoLayout(ctx, auto);
  if (pinned.length === 0) return state;
  return placePinnedLayout({ ctx, entries: pinned, state, baseIndex: pages.length });
}
