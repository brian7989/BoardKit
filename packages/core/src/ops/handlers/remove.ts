import { err, ok, type BoardId, type TileId, type WidgetId } from '../../shared/index.js';
import { findBoard, type BoardsState } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { detach } from '../primitives/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { Change } from '../outcome/Change.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

export interface RemoveOp {
  readonly type: typeof OpType.Remove;
  readonly board: BoardId;
  readonly tile: TileId;
  readonly widget?: WidgetId;
}

// Geometry-free: removing a tile (or one stack member) never needs the solver.
export function remove(op: RemoveOp, _ctx: EngineContext, state: BoardsState): OpOutcome {
  const board = findBoard(state, op.board);
  const tile = board?.tiles.find((candidate) => candidate.id === op.tile);
  const widgetExists = !op.widget || tile?.items.some((item) => item.id === op.widget);
  if (!board || !tile || !widgetExists) return err({ reason: RejectReason.UnknownTarget });

  const updatedBoard = detach(board, op.tile, op.widget);
  const change: Change = { tile: op.tile, board: board.id, kind: ChangeKind.Removed };
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? updatedBoard : candidate));
  return ok({ candidate: { grid: state.grid, boards }, changes: [change] });
}
