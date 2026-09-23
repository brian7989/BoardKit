import type { Board } from '../model/Board.js';
import type { Tile } from '../model/Tile.js';
import type { BoardId } from '../shared/ids/BoardId.js';

export interface ReflowEntry {
  readonly tile: Tile;
  readonly board: BoardId;
}

function byReadingOrder(a: Tile, b: Tile): number {
  return a.row - b.row || a.col - b.col;
}

// Board order, then row, then col — the order a person scanning the old layout would see tiles in.
export function flattenReadingOrder(boards: readonly Board[]): readonly ReflowEntry[] {
  return boards.flatMap((board) => [...board.tiles].sort(byReadingOrder).map((tile) => ({ tile, board: board.id })));
}
