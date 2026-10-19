import { markValid, type BoardsState } from '../model/index.js';
import type { TileId } from '../shared/ids/TileId.js';

/** Parks `tiles` on `state`'s grid: off its boards, kept in `parked`, and saved as hidden when the board leaves this grid. */
export function hideTiles(state: BoardsState, tiles: ReadonlySet<TileId>): BoardsState {
  const moving = state.boards.flatMap((board) => board.tiles.filter((tile) => tiles.has(tile.id)));
  if (moving.length === 0) return state;
  const boards = state.boards.map((board) => ({ ...board, tiles: board.tiles.filter((tile) => !tiles.has(tile.id)) }));
  return markValid({ grid: state.grid, boards, layouts: state.layouts, parked: [...state.parked, ...moving] });
}
