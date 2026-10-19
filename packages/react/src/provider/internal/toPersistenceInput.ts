import type { BoardsState, Engine } from 'boardkit-core';
import type { UseBoardsPersistenceInput } from '../persistence/useBoardsPersistence.js';
import type { BoardProviderProps } from '../BoardProvider.js';

// Uncontrolled only: a controlled host owns its state, so it owns saving it too (see `restoreBoards`).
export function toPersistenceInput(props: BoardProviderProps, engine: Engine, state: BoardsState): UseBoardsPersistenceInput {
  const saves = props.storageKey !== undefined && props.value === undefined;
  return { engine, state, ...(saves ? { storageKey: props.storageKey } : {}) };
}
