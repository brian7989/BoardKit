import { useRef } from 'react';
import type { BoardsState } from 'boardkit-core';

export interface LatestStateRef {
  readonly ref: { current: BoardsState };
  readonly getState: () => BoardsState;
}

// Stable getter closing over a ref, so dispatch reads latest state without `state` in its deps.
export function useLatestStateRef(state: BoardsState): LatestStateRef {
  const ref = useRef(state);
  ref.current = state;
  const getState = useRef(() => ref.current).current;
  return { ref, getState };
}
