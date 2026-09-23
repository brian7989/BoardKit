import { rectContains, rectOfTile, type Rect } from '../../shared/geometry/Rect.js';
import { cell, type Cell, type Size } from '../../shared/index.js';
import { isFloating, type Board, type Tile } from '../../model/index.js';
import type { EngineContext } from '../../engine/EngineContext.js';
import { relocateTiles } from '../../solver/index.js';
import { err, ok, type Result } from '../../shared/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { Change } from '../outcome/Change.js';
import type { Rejection } from '../outcome/Rejection.js';

export interface PlacePinnedInput {
  readonly board: Board;
  readonly tile: Tile;
  readonly size: Size;
  readonly ctx: EngineContext;
}

export interface PlacePinnedResult {
  readonly board: Board;
  readonly displaced: readonly Change[];
}

// Untouched tiles keep object identity for React memoization. Floating tiles excluded from obstacles.
export function placePinned(input: PlacePinnedInput): Result<PlacePinnedResult, Rejection> {
  const { board, tile, size, ctx } = input;
  const rect = rectOfTile({ x: tile.col, y: tile.row }, size);
  const boardRect: Rect<Cell> = { x: cell(0), y: cell(0), w: cell(ctx.grid.cols), h: cell(ctx.grid.rows) };
  if (!rectContains(boardRect, rect)) return err({ reason: RejectReason.OutOfBounds });

  const others = board.tiles.filter((existing) => existing.id !== tile.id && !isFloating(existing));
  const floaters = board.tiles.filter((existing) => existing.id !== tile.id && isFloating(existing));
  const relocation = relocateTiles({
    tiles: others,
    pinnedTileId: tile.id,
    pinnedRect: rect,
    grid: { cols: ctx.grid.cols, rows: ctx.grid.rows },
    sizeOf: (candidate) => candidate.size,
    options: ctx.solver,
  });
  if (!relocation.ok) return err({ reason: RejectReason.NoValidArrangement, blockedBy: relocation.error.blockedBy });

  const { tiles, displaced } = applyRelocation(others, relocation.value, board.id);
  return ok({ board: { ...board, tiles: [...tiles, ...floaters, tile] }, displaced });
}

function applyRelocation(
  others: readonly Tile[],
  positions: ReadonlyMap<Tile['id'], Rect<Cell>>,
  boardId: Board['id'],
): { readonly tiles: readonly Tile[]; readonly displaced: readonly Change[] } {
  const displaced: Change[] = [];
  const tiles = others.map((existing) => {
    const next = positions.get(existing.id);
    if (!next) return existing;
    const from: Rect<Cell> = { x: existing.col, y: existing.row, w: next.w, h: next.h };
    displaced.push({ tile: existing.id, board: boardId, kind: ChangeKind.Moved, from, to: next });
    return { ...existing, col: next.x, row: next.y };
  });
  return { tiles, displaced };
}
