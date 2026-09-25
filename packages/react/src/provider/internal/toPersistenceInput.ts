import type { BoardsState, Engine } from 'boardkit-core';
import type { UseBoardsPersistenceInput } from '../persistence/useBoardsPersistence.js';
import type { BoardProviderProps } from '../BoardProvider.js';

// Controlled boards persist too: the host loads with `loadBoards`, and every commit is saved here.
export function toPersistenceInput(props: BoardProviderProps, engine: Engine, state: BoardsState): UseBoardsPersistenceInput {
  return { engine, state, ...(props.storageKey ? { storageKey: props.storageKey } : {}) };
}
