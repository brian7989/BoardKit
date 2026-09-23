import type { Size } from '../../shared/index.js';
import { isFloating, type Board, type Tile } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { findFreeSpace } from '../../solver/index.js';
import { err, ok, type Result } from '../../shared/index.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { Rejection } from '../outcome/Rejection.js';

export interface PlaceFreeInput {
  readonly board: Board;
  readonly tile: Tile;
  readonly size: Size;
  readonly ctx: EngineContext;
}

// Floating tiles don't block free space (their col/row is stale, not real).
export function placeFree(input: PlaceFreeInput): Result<Board, Rejection> {
  const { board, tile, size, ctx } = input;
  const origin = findFreeSpace({
    tiles: board.tiles.filter((candidate) => !isFloating(candidate)),
    size,
    grid: { cols: ctx.grid.cols, rows: ctx.grid.rows },
    sizeOf: (candidate) => candidate.size,
  });
  if (!origin) return err({ reason: RejectReason.NoFreeSpace });
  const placed: Tile = { ...tile, col: origin.x, row: origin.y };
  return ok({ ...board, tiles: [...board.tiles, placed] });
}
