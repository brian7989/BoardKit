import { err, ok, sizesEqual, type BoardId, type TileId } from '../../shared/index.js';
import { findBoard, type BoardsState } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { merge } from '../primitives/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { Change } from '../outcome/Change.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

export interface StackOp {
  readonly type: typeof OpType.Stack;
  readonly board: BoardId;
  readonly from: TileId;
  readonly onto: TileId;
}

// Size match is the only check needed; items already validated at source size.
export function stack(op: StackOp, _ctx: EngineContext, state: BoardsState): OpOutcome {
  const board = findBoard(state, op.board);
  const source = board?.tiles.find((candidate) => candidate.id === op.from);
  const target = board?.tiles.find((candidate) => candidate.id === op.onto);
  if (!board || !source || !target || source.id === target.id) return err({ reason: RejectReason.UnknownTarget });
  if (!sizesEqual(source.size, target.size)) return err({ reason: RejectReason.StackIncompatible });

  const updatedBoard = merge(board, source.id, target.id);
  const changes: Change[] = [
    { tile: source.id, board: board.id, kind: ChangeKind.Removed },
    { tile: target.id, board: board.id, kind: ChangeKind.Stacked },
  ];
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? updatedBoard : candidate));
  return ok({ candidate: { grid: state.grid, boards }, changes });
}
