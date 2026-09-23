import type { BoardsState } from 'boardkit-core';
import type { BoardsConfig } from './BoardsConfig.js';
import { createInitialState } from './createInitialState.js';
import { loadPersistedState } from '../persistence/loadPersistedState.js';

/** What an uncontrolled `BoardProvider` starts from: a persisted save, else its `initialLayout`. */
export function resolveInitialState(config: BoardsConfig, storageKey?: string): BoardsState {
  const persisted = storageKey ? loadPersistedState(config, storageKey) : null;
  return persisted ?? createInitialState(config);
}
