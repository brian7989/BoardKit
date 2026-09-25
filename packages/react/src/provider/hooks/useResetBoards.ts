import { useBoardsConfig } from '../internal/useBoardsConfig.js';

/** Resets the board to its authored layouts on every breakpoint, committing through `onChange` like any other change. */
export function useResetBoards(): () => void {
  return useBoardsConfig().reset;
}
