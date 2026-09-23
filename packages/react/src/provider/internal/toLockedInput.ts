import type { UseControllableLockedInput } from './useControllableLocked.js';
import type { BoardProviderProps } from '../BoardProvider.js';

export function toLockedInput(props: BoardProviderProps): UseControllableLockedInput {
  return {
    ...(props.locked !== undefined ? { locked: props.locked } : {}),
    ...(props.defaultLocked !== undefined ? { defaultLocked: props.defaultLocked } : {}),
    ...(props.onLockedChange ? { onLockedChange: props.onLockedChange } : {}),
  };
}
