import { useLayoutEffect, useRef } from 'react';
import type { BoardsState } from 'boardkit-core';
import { createStateStore, type StateStore } from './createStateStore.js';

// One store per provider, lazily created, kept in step with the render's authoritative `state`.
export function useBoardsStateStore(state: BoardsState): StateStore<BoardsState> {
  const storeRef = useRef<StateStore<BoardsState> | null>(null);
  if (!storeRef.current) storeRef.current = createStateStore(state);
  const store = storeRef.current;

  useLayoutEffect(() => {
    if (store.getState() !== state) store.setState(state);
  });

  return store;
}
