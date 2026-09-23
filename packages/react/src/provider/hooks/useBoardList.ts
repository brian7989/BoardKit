import { useCallback, useMemo } from 'react';
import { boardId, OpType, type Applied, type Board, type BoardId, type Rejection, type Result } from 'boardkit-core';
import { useBoards } from './useBoards.js';

/** One board page in the list: its id, position, and whether it's the active one. */
export interface BoardListItem {
  readonly id: BoardId;
  readonly index: number;
  readonly isActive: boolean;
  readonly tileCount: number;
}

/** The result of `useBoardList`: every board page, plus switch/add/remove actions. */
export interface BoardList {
  readonly boards: readonly BoardListItem[];
  readonly activeId: BoardId;
  readonly select: (board: BoardId) => void;
  readonly add: () => Result<Applied, Rejection>;
  readonly remove: (board: BoardId) => Result<Applied, Rejection>;
  readonly canRemove: (board: BoardId) => boolean;
}

function toItems(boards: readonly Board[], activeId: BoardId): readonly BoardListItem[] {
  return boards.map((board, index) => ({ id: board.id, index, isActive: board.id === activeId, tileCount: board.tiles.length }));
}

/** Board pages to list (numbered by position, since boards have no name), plus switch/add/remove. `add` switches to the new board. */
export function useBoardList(): BoardList {
  const { state, activeBoardId, setActiveBoard, dispatch, createId, canApply } = useBoards();

  const add = useCallback(() => {
    const board = boardId(createId());
    const result = dispatch({ type: OpType.AddBoard, board });
    if (result.ok) setActiveBoard(board);
    return result;
  }, [dispatch, createId, setActiveBoard]);
  const remove = useCallback((board: BoardId) => dispatch({ type: OpType.RemoveBoard, board }), [dispatch]);
  const canRemove = useCallback((board: BoardId) => canApply({ type: OpType.RemoveBoard, board }), [canApply]);
  const items = useMemo(() => toItems(state.boards, activeBoardId), [state.boards, activeBoardId]);

  return useMemo(
    () => ({ boards: items, activeId: activeBoardId, select: setActiveBoard, add, remove, canRemove }),
    [items, activeBoardId, setActiveBoard, add, remove, canRemove],
  );
}
