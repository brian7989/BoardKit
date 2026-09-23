import { useContext } from 'react';
import { BoardsConfigContext, type BoardsConfigContextValue } from './BoardsConfigContext.js';

export function useBoardsConfig(): BoardsConfigContextValue {
  const value = useContext(BoardsConfigContext);
  if (!value) throw new Error('useBoardsConfig must be used within a <BoardProvider>.');
  return value;
}
