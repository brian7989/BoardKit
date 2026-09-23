import type { ValidCandidate } from '../model/index.js';
import type { TileId } from '../shared/ids/TileId.js';
import type { EngineContext } from '../engine/index.js';
import { findFreeSpace } from '../solver/index.js';

// Moves a tile to the first free rect among the other tiles on its board. Returns null when no
// free rect exists; the caller drops the tile then.
export function relocateInvalidTile(candidate: ValidCandidate, tileId: TileId, ctx: EngineContext): ValidCandidate | null {
  const board = candidate.boards.find((b) => b.tiles.some((tile) => tile.id === tileId));
  const tile = board?.tiles.find((candidateTile) => candidateTile.id === tileId);
  if (!board || !tile) return null;

  const others = board.tiles.filter((candidateTile) => candidateTile.id !== tileId);
  const origin = findFreeSpace({ tiles: others, size: tile.size, grid: ctx.grid, sizeOf: (t) => t.size });
  if (!origin) return null;

  const relocated = { ...tile, col: origin.x, row: origin.y };
  const boards = candidate.boards.map((b) => (b.id === board.id ? { ...b, tiles: [...others, relocated] } : b));
  return { ...candidate, boards };
}
