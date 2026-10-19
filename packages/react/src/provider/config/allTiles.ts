import type { BoardsState, Tile } from 'boardkit-core';

/** Every tile in `state`: on its boards, and parked. */
export function allTiles(state: BoardsState): readonly Tile[] {
  return [...state.boards.flatMap((board) => board.tiles), ...state.parked];
}
