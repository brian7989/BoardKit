import type { BoardsState } from 'boardkit-core';
import type { BoardsConfig } from './BoardsConfig.js';
import type { InitialLayoutTile } from './InitialLayoutTile.js';
import type { InitialPlacementCtx } from './InitialPlacementCtx.js';
import type { ResolvedInitialTile } from './resolveInitialTile.js';
import { resolveEntries } from './resolveEntries.js';
import { placeFirstFit, type PageProgress } from './placeFirstFit.js';

export interface AddMissingTilesInput {
  // The document's own (widest) config, and the state built on it so far.
  readonly config: BoardsConfig;
  readonly state: BoardsState;
  // Another breakpoint's config and authored layout, which may list widgets `state` lacks.
  readonly from: BoardsConfig;
  readonly entries: readonly InitialLayoutTile[];
}

function tileIds(state: BoardsState): ReadonlySet<string> {
  return new Set(state.boards.flatMap((board) => board.tiles.map((tile) => tile.id)));
}

// Its authored spot belongs to the other grid, so here it just goes wherever first-fit finds room.
function unpositioned(resolved: ResolvedInitialTile): ResolvedInitialTile {
  const { float: _float, ...rest } = resolved;
  return rest;
}

/** Adds every widget another breakpoint's layout lists but `state` doesn't have yet, so each breakpoint shares one set of widgets. */
export function addMissingTiles(input: AddMissingTilesInput): BoardsState {
  const present = tileIds(input.state);
  const missing = resolveEntries({ config: input.from, counts: new Map() }, input.entries).filter((item) => !present.has(item.resolved.tileId));
  const ctx: InitialPlacementCtx = { config: input.config, counts: new Map() };
  let progress: PageProgress = { state: input.state, pages: input.state.boards.map((board) => board.id) };
  for (const item of missing) progress = placeFirstFit(ctx, progress, unpositioned(item.resolved));
  return progress.state;
}
