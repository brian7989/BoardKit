import type { BoardsState } from 'boardkit-core';
import type { BoardsConfig } from '../config/BoardsConfig.js';
import { warnUnregisteredLoadedWidgets } from './warnUnregisteredLoadedWidgets.js';

function readRaw(storageKey: string): unknown {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved === null ? null : JSON.parse(saved);
  } catch {
    return null;
  }
}

/** Loads and repairs a saved board from `localStorage`, or null if there is nothing usable. */
export function loadPersistedState(config: BoardsConfig, storageKey: string): BoardsState | null {
  if (typeof window === 'undefined') return null;
  const raw = readRaw(storageKey);
  if (raw === null) return null;
  warnUnregisteredLoadedWidgets(raw, config.widgets);
  const repaired = config.engine.repair(raw);
  return repaired.ok ? repaired.value.state : null;
}
