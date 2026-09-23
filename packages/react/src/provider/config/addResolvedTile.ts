import { OpType, tileId as toTileId, type Applied, type BoardId, type BoardsState, type Cell, type Point, type Rejection, type Result } from 'boardkit-core';
import type { BoardsConfig } from './BoardsConfig.js';
import type { ResolvedInitialTile } from './resolveInitialTile.js';

export interface AddResolvedTileInput {
  readonly config: BoardsConfig;
  readonly state: BoardsState;
  readonly board: BoardId;
  readonly resolved: ResolvedInitialTile;
  readonly at?: Point<Cell>;
}

/** Applies the `Add` op for an already-resolved initial-layout tile, pinned or floating. */
export function addResolvedTile(input: AddResolvedTileInput): Result<Applied, Rejection> {
  const { config, state, board, resolved, at } = input;
  return config.engine.apply(state, {
    type: OpType.Add,
    board,
    tileId: toTileId(resolved.tileId),
    widget: resolved.widget,
    size: resolved.size,
    ...(at ? { at } : {}),
    ...(resolved.float ? { float: resolved.float } : {}),
  });
}
