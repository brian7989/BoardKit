import { useBoards } from './useBoards.js';

/** The active breakpoint: its name, and its grid's dimensions. Throws outside a `<BoardProvider>`. */
export function useGrid(): { readonly name: string; readonly cols: number; readonly rows: number; readonly cellAspect: number } {
  return useBoards().grid;
}
