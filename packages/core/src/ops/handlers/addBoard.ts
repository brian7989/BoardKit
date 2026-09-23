import { ok, type BoardId } from '../../shared/index.js';
import type { Board, BoardsState } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import type { Change } from '../outcome/Change.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

export interface AddBoardOp {
  readonly type: typeof OpType.AddBoard;
  readonly board: BoardId;
}

export function addBoard(op: AddBoardOp, _ctx: EngineContext, state: BoardsState): OpOutcome {
  const board: Board = { id: op.board, tiles: [] };
  const change: Change = { board: op.board, kind: ChangeKind.BoardAdded };
  return ok({ candidate: { grid: state.grid, boards: [...state.boards, board] }, changes: [change] });
}
