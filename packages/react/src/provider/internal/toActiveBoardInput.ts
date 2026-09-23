import type { BoardsState } from 'boardkit-core';
import type { UseControllableActiveBoardInput } from './useControllableActiveBoard.js';
import type { BoardProviderProps } from '../BoardProvider.js';

export function toActiveBoardInput(props: BoardProviderProps, state: BoardsState): UseControllableActiveBoardInput {
  return {
    state,
    ...(props.activeBoard !== undefined ? { activeBoard: props.activeBoard } : {}),
    ...(props.defaultActiveBoard !== undefined ? { defaultActiveBoard: props.defaultActiveBoard } : {}),
    ...(props.onActiveBoardChange ? { onActiveBoardChange: props.onActiveBoardChange } : {}),
  };
}
