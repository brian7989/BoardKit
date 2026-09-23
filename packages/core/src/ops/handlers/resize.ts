import { clampRectToBoard, rectOfTile } from '../../shared/geometry/Rect.js';
import type { Point } from '../../shared/geometry/Point.js';
import { err, ok, isSizeAllowed, type BoardId, type Cell, type Size, type TileId } from '../../shared/index.js';
import { findBoard, type Tile, type BoardsState } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { placePinned } from '../primitives/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

export interface ResizeOp {
  readonly type: typeof OpType.Resize;
  readonly board: BoardId;
  readonly tile: TileId;
  readonly size: Size;
}

export function resize(op: ResizeOp, ctx: EngineContext, state: BoardsState): OpOutcome {
  const board = findBoard(state, op.board);
  const tile = board?.tiles.find((candidate) => candidate.id === op.tile);
  if (!board || !tile) return err({ reason: RejectReason.UnknownTarget });

  const supported = tile.items.every((item) => isSizeAllowed(op.size, ctx.catalog[item.type]?.sizes ?? []));
  if (!supported) return err({ reason: RejectReason.SizeNotAllowed });

  const from = rectOfTile({ x: tile.col, y: tile.row }, tile.size);
  const origin = positionForResize(tile, op.size, ctx);
  const resized: Tile = { ...tile, col: origin.x, row: origin.y, size: op.size };

  const placement = placePinned({ board, tile: resized, size: op.size, ctx });
  if (!placement.ok) return placement;

  const to = rectOfTile({ x: resized.col, y: resized.row }, op.size);
  const change = { tile: tile.id, board: board.id, kind: ChangeKind.Resized, from, to };
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? placement.value.board : candidate));
  return ok({ candidate: { grid: state.grid, boards }, changes: [change, ...placement.value.displaced] });
}

// Grows in place, then nudges inward to stay on the board when configured to.
function positionForResize(tile: Tile, size: Size, ctx: EngineContext): Point<Cell> {
  const grown = { x: tile.col, y: tile.row, w: size.w, h: size.h };
  return ctx.solver.nudgeOnResize ? clampRectToBoard(grown, ctx.grid) : grown;
}
