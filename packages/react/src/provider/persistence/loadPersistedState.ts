import type { BoardsState } from 'boardkit-core';
import type { BoardsConfig } from '../config/BoardsConfig.js';
import { restoreSave } from './restoreSave.js';

function readRaw(storageKey: string): unknown {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved === null ? null : JSON.parse(saved);
  } catch {
    return null;
  }
}

/** The board an uncontrolled `BoardProvider` saved under `storageKey`, restored, or null if there is nothing usable. */
export function loadPersistedState(config: BoardsConfig, storageKey: string): BoardsState | null {
  if (typeof window === 'undefined') return null;
  return restoreSave(config, readRaw(storageKey), `the save under "${storageKey}"`);
}
