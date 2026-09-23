import { useContext } from 'react';
import { BoardsContext, type BoardsContextValue } from '../BoardsContext.js';

/** State, engine, and dispatch/canApply for host-built UI. Throws outside a `<BoardProvider>`. */
export function useBoards(): BoardsContextValue {
  const value = useContext(BoardsContext);
  if (!value) throw new Error('useBoards must be used within a <BoardProvider>.');
  return value;
}
