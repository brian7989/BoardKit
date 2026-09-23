import { useCallback } from 'react';
import type { Applied, BoardsState, Engine, Op, Rejection, Result } from 'boardkit-core';
import type { CommitBoardsState } from './useControllableBoardsState.js';
import { ChangeReason } from '../ChangeReason.js';


export interface UseDispatchInput {
  readonly engine: Engine;
  // A getter, not the state itself, so dispatch's identity stays stable across commits.
  readonly getState: () => BoardsState;
  readonly commit: CommitBoardsState;
  readonly onReject?: (rejection: Rejection, op: Op) => void;
}

export type Dispatch = (op: Op) => Result<Applied, Rejection>;

export function useDispatch(input: UseDispatchInput): Dispatch {
  const { engine, getState, commit, onReject } = input;
  return useCallback<Dispatch>(
    (op) => {
      const result = engine.apply(getState(), op);
      if (result.ok) commit(result.value.state, { reason: ChangeReason.Op, op, changes: result.value.changes });
      else onReject?.(result.error, op);
      return result;
    },
    [engine, getState, commit, onReject],
  );
}
