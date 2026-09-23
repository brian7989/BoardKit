import { findBoard } from './findBoard.js';
import type { BoardsState } from './BoardsState.js';
import type { Tile } from './Tile.js';
import type { BoardId } from '../shared/ids/BoardId.js';
import type { TileId } from '../shared/ids/TileId.js';

/** The tile with this id on this board, or `undefined` if either lookup misses. */
export function findTile(state: BoardsState, board: BoardId, tile: TileId): Tile | undefined {
  return findBoard(state, board)?.tiles.find((candidate) => candidate.id === tile);
}
