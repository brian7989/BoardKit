import type { Board } from './Board.js';
import type { BoardsState } from './BoardsState.js';
import type { BoardId } from '../shared/ids/BoardId.js';

/** The board with this id, or `undefined` if none does. */
export function findBoard(state: BoardsState, board: BoardId): Board | undefined {
  return state.boards.find((candidate) => candidate.id === board);
}
