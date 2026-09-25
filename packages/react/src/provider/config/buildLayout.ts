import type { BoardsState } from 'boardkit-core';
import type { BoardsConfig } from './BoardsConfig.js';
import type { InitialLayoutTile } from './InitialLayoutTile.js';
import type { InitialPlacementCtx } from './InitialPlacementCtx.js';
import { resolveEntries } from './resolveEntries.js';
import { placeAutoLayout } from './placeAutoLayout.js';
import { placePinnedLayout } from './placePinnedLayout.js';

/** Places one layout's entries on `config`'s engine: default-page entries first, then explicit `page`s after them. */
export function buildLayout(config: BoardsConfig, entries: readonly InitialLayoutTile[]): BoardsState {
  const ctx: InitialPlacementCtx = { config, counts: new Map() };
  const resolved = resolveEntries(ctx, entries);
  const auto = resolved.filter((item) => item.entry.page === undefined);
  const pinned = resolved.filter((item) => item.entry.page !== undefined);
  const { state, pages } = placeAutoLayout(ctx, auto);
  if (pinned.length === 0) return state;
  return placePinnedLayout({ ctx, entries: pinned, state, baseIndex: pages.length });
}
