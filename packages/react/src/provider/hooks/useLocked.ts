import { useBoards } from './useBoards.js';

/** Whether the board is locked (read-only). */
export function useLocked(): boolean {
  return useBoards().locked;
}
