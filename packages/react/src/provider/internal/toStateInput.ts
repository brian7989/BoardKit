import { loadBoards } from '../persistence/loadBoards.js';
import type { UseControllableBoardsStateInput } from './useControllableBoardsState.js';
import type { BoardProviderProps } from '../BoardProvider.js';

// Drops unset keys rather than passing explicit `undefined` (exactOptionalPropertyTypes).
export function toStateInput(props: BoardProviderProps): UseControllableBoardsStateInput {
  return {
    ...(props.value !== undefined ? { value: props.value } : {}),
    ...(props.defaultValue !== undefined ? { defaultValue: props.defaultValue } : {}),
    initial: () => loadBoards(props.config, props.storageKey),
    ...(props.onChange ? { onChange: props.onChange } : {}),
  };
}
