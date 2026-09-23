import { useCallback, useEffect, useState } from 'react';
import type { BoardId, BoardsState } from 'boardkit-core';

export interface UseControllableActiveBoardInput {
  readonly state: BoardsState;
  readonly activeBoard?: BoardId;
  readonly defaultActiveBoard?: BoardId;
  readonly onActiveBoardChange?: (next: BoardId) => void;
}

export type SetActiveBoard = (next: BoardId) => void;

interface ResolvedActiveBoard {
  readonly resolved: BoardId | undefined;
  readonly exists: boolean;
}

function resolveActiveBoard(state: BoardsState, requested: BoardId | undefined): ResolvedActiveBoard {
  const exists = state.boards.some((board) => board.id === requested);
  return { resolved: exists ? requested : state.boards[0]?.id, exists };
}

// Falls back to the nearest remaining board (and fires onActiveBoardChange) if the active one no longer exists.
export function useControllableActiveBoard(input: UseControllableActiveBoardInput): readonly [BoardId, SetActiveBoard] {
  const { state, activeBoard: controlled, defaultActiveBoard, onActiveBoardChange } = input;
  const [uncontrolled, setUncontrolled] = useState(defaultActiveBoard ?? state.boards[0]?.id);
  const { resolved, exists } = resolveActiveBoard(state, controlled ?? uncontrolled);

  const setActive = useCallback<SetActiveBoard>(
    (next) => {
      if (controlled === undefined) setUncontrolled(next);
      onActiveBoardChange?.(next);
    },
    [controlled, onActiveBoardChange],
  );

  useEffect(() => {
    if (exists || !resolved) return;
    if (controlled === undefined) setUncontrolled(resolved);
    onActiveBoardChange?.(resolved);
  }, [exists, resolved, controlled, onActiveBoardChange]);

  if (!resolved) throw new Error('BoardsState must have at least one board.');
  return [resolved, setActive];
}
