import { loadPersistedState } from '../persistence/loadPersistedState.js';
import { createInitialState } from '../config/createInitialState.js';
import type { UseControllableBoardsStateInput } from './useControllableBoardsState.js';
import type { BoardProviderProps } from '../BoardProvider.js';

// Drops unset keys rather than passing explicit `undefined` (exactOptionalPropertyTypes).
export function toStateInput(props: BoardProviderProps): UseControllableBoardsStateInput {
  return {
    ...(props.value !== undefined ? { value: props.value } : {}),
    ...(props.defaultValue !== undefined ? { defaultValue: props.defaultValue } : {}),
    initial: () => (props.storageKey ? loadPersistedState(props.config, props.storageKey) : null) ?? createInitialState(props.config),
    ...(props.onChange ? { onChange: props.onChange } : {}),
  };
}
