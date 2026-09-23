import { rectOfTile } from '../../shared/geometry/Rect.js';
import type { Point } from '../../shared/geometry/Point.js';
import { err, ok, type BoardId, type Cell, type TileId } from '../../shared/index.js';
import { findBoard, type BoardsState } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { placePinned } from '../primitives/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

export interface MoveOp {
  readonly type: typeof OpType.Move;
  readonly board: BoardId;
  readonly tile: TileId;
  readonly to: Point<Cell>;
}

export function move(op: MoveOp, ctx: EngineContext, state: BoardsState): OpOutcome {
  const board = findBoard(state, op.board);
  const tile = board?.tiles.find((candidate) => candidate.id === op.tile);
  if (!board || !tile) return err({ reason: RejectReason.UnknownTarget });

  const from = rectOfTile({ x: tile.col, y: tile.row }, tile.size);
  const moved = { ...tile, col: op.to.x, row: op.to.y };
  const placement = placePinned({ board, tile: moved, size: tile.size, ctx });
  if (!placement.ok) return placement;

  const to = rectOfTile({ x: moved.col, y: moved.row }, tile.size);
  const change = { tile: tile.id, board: board.id, kind: ChangeKind.Moved, from, to };
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? placement.value.board : candidate));
  return ok({ candidate: { grid: state.grid, boards }, changes: [change, ...placement.value.displaced] });
}
