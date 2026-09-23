import type { ValidCandidate } from '../model/index.js';
import type { TileId } from '../shared/ids/TileId.js';

export function dropInvalidTile(candidate: ValidCandidate, tileId: TileId): ValidCandidate {
  const boards = candidate.boards.map((board) => {
    if (!board.tiles.some((tile) => tile.id === tileId)) return board;
    return { ...board, tiles: board.tiles.filter((tile) => tile.id !== tileId) };
  });
  return { ...candidate, boards };
}
