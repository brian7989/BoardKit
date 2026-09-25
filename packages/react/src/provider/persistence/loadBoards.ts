import type { BoardsState } from 'boardkit-core';
import type { BoardsConfig } from '../config/BoardsConfig.js';
import { createInitialState, type CreateInitialStateOptions } from '../config/createInitialState.js';
import { loadPersistedState } from './loadPersistedState.js';

/** The state a board starts from: what's saved under `storageKey` (repaired), else its authored layouts. SSR-safe. */
export function loadBoards(config: BoardsConfig, storageKey?: string, options: CreateInitialStateOptions = {}): BoardsState {
  const persisted = storageKey ? loadPersistedState(config, storageKey) : null;
  return persisted ?? createInitialState(config, options);
}
