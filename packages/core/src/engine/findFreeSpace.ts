import type { BoardId } from '../shared/ids/BoardId.js';
import type { Point } from '../shared/geometry/Point.js';
import type { Cell } from '../shared/units/Cell.js';
import type { Size } from '../shared/sizes/Size.js';
import { findBoard, isFloating, type BoardsState } from '../model/index.js';
import { findFreeSpace as findFreeSpaceInGrid } from '../solver/index.js';
import type { EngineContext } from './EngineContext.js';

export interface FindFreeSpaceInput {
  readonly state: BoardsState;
  readonly board: BoardId;
  readonly size: Size;
  readonly ctx: EngineContext;
}

// A floating tile's col/row is stale, not real occupancy, so it's exempt here too (placeFree).
export function findFreeSpace(input: FindFreeSpaceInput): Point<Cell> | null {
  const target = findBoard(input.state, input.board);
  if (!target) return null;
  return findFreeSpaceInGrid({
    tiles: target.tiles.filter((tile) => !isFloating(tile)),
    size: input.size,
    grid: input.ctx.grid,
    sizeOf: (tile) => tile.size,
  });
}
