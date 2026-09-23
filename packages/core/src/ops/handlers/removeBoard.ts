import { err, ok, type BoardId } from '../../shared/index.js';
import { findBoard, type BoardsState } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { Change } from '../outcome/Change.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

export interface RemoveBoardOp {
  readonly type: typeof OpType.RemoveBoard;
  readonly board: BoardId;
}

export function removeBoard(op: RemoveBoardOp, _ctx: EngineContext, state: BoardsState): OpOutcome {
  const board = findBoard(state, op.board);
  if (!board) return err({ reason: RejectReason.UnknownTarget });
  if (state.boards.length <= 1) return err({ reason: RejectReason.LastBoard });

  const boards = state.boards.filter((candidate) => candidate.id !== op.board);
  const change: Change = { board: op.board, kind: ChangeKind.BoardRemoved };
  return ok({ candidate: { grid: state.grid, boards }, changes: [change] });
}
