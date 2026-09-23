import { useBoards } from './useBoards.js';

/** The active breakpoint's grid dimensions. Throws outside a `<BoardProvider>`. */
export function useGrid(): { readonly cols: number; readonly rows: number; readonly cellAspect: number } {
  return useBoards().grid;
}
