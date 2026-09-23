import { useCallback, useState } from 'react';
import type { BoardsState } from 'boardkit-core';
import type { ChangeMeta } from '../ChangeMeta.js';
import { useLatestStateRef } from './useLatestStateRef.js';

export interface UseControllableBoardsStateInput {
  readonly value?: BoardsState;
  readonly defaultValue?: BoardsState;
  // Lazily computed (persisted save, else the config's initialLayout) only when truly needed.
  readonly initial: () => BoardsState;
  readonly onChange?: (next: BoardsState, meta: ChangeMeta) => void;
}

export type CommitBoardsState = (next: BoardsState, meta: ChangeMeta) => void;

export interface UseControllableBoardsStateResult {
  readonly state: BoardsState;
  readonly commit: CommitBoardsState;
  // Reads the latest effective state even from a second dispatch in the same tick, before React re-renders.
  readonly getState: () => BoardsState;
}

function resolveUncontrolled(input: UseControllableBoardsStateInput): BoardsState {
  if (input.value !== undefined) return input.value;
  return input.defaultValue ?? input.initial();
}

export function useControllableBoardsState(input: UseControllableBoardsStateInput): UseControllableBoardsStateResult {
  const [uncontrolled, setUncontrolled] = useState(() => resolveUncontrolled(input));
  const controlled = input.value;
  const state = controlled ?? uncontrolled;

  const { ref: stateRef, getState } = useLatestStateRef(state);

  const onChange = input.onChange;
  const commit = useCallback<CommitBoardsState>(
    (next, meta) => {
      if (controlled === undefined) {
        stateRef.current = next;
        setUncontrolled(next);
      }
      onChange?.(next, meta);
    },
    [controlled, onChange, stateRef],
  );

  return { state, commit, getState };
}
