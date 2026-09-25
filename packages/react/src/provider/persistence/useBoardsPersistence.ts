import { useEffect } from 'react';
import type { BoardsState, Engine } from 'boardkit-core';

const SAVE_DEBOUNCE_MS = 250;

export interface UseBoardsPersistenceInput {
  readonly storageKey?: string;
  readonly engine: Engine;
  readonly state: BoardsState;
}

function save(storageKey: string, engine: Engine, state: BoardsState): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(engine.serialize(state)));
  } catch {
    // Storage can throw (quota, privacy mode, disabled); persistence is best-effort.
  }
}

/** Debounced `localStorage` save on every commit, flushed immediately on `pagehide`. SSR-safe. */
export function useBoardsPersistence(input: UseBoardsPersistenceInput): void {
  const { storageKey, engine, state } = input;
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return undefined;
    const flush = () => save(storageKey, engine, state);
    const timer = setTimeout(flush, SAVE_DEBOUNCE_MS);
    window.addEventListener('pagehide', flush);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pagehide', flush);
    };
  }, [storageKey, engine, state]);
}
