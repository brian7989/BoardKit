import type { BoardsState, Engine } from 'boardkit-core';
import type { UseBoardsPersistenceInput } from '../persistence/useBoardsPersistence.js';
import type { BoardProviderProps } from '../BoardProvider.js';

// Drops `storageKey` when unset rather than passing explicit `undefined` (exactOptionalPropertyTypes).
export function toPersistenceInput(props: BoardProviderProps, engine: Engine, state: BoardsState): UseBoardsPersistenceInput {
  return { engine, state, enabled: props.value === undefined, ...(props.storageKey ? { storageKey: props.storageKey } : {}) };
}
