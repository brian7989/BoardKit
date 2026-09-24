import { clampRectToBoard, rectOfTile } from '../shared/geometry/Rect.js';
import { cell } from '../shared/units/Cell.js';
import { layerOf, TileLayer, type Board, type Tile, type ValidCandidate } from '../model/index.js';
import type { TileId } from '../shared/ids/TileId.js';
import type { EngineContext } from '../engine/index.js';
import { findFreeSpace } from '../solver/index.js';

interface RelocateInput {
  readonly candidate: ValidCandidate;
  readonly board: Board;
  readonly tile: Tile;
  readonly ctx: EngineContext;
}

function withTiles(candidate: ValidCandidate, board: Board, tiles: readonly Tile[]): ValidCandidate {
  const boards = candidate.boards.map((b) => (b.id === board.id ? { ...b, tiles } : b));
  return { ...candidate, boards };
}

// A Grid tile moves to the first free rect among the board's other Grid tiles; null (dropped by
// the caller) only if none exists.
function relocateGrid(input: RelocateInput): ValidCandidate | null {
  const { candidate, board, tile, ctx } = input;
  const others = board.tiles.filter((candidateTile) => candidateTile.id !== tile.id);
  const origin = findFreeSpace({ tiles: others, size: tile.size, grid: ctx.grid, sizeOf: (t) => t.size });
  if (!origin) return null;
  return withTiles(candidate, board, [...others, { ...tile, col: origin.x, row: origin.y }]);
}

// An Overlay tile's real spot lives in float.x/y (always set); findFreeSpace reads col/row.
function withFloatAsColRow(tile: Tile): Tile {
  return { ...tile, col: cell(tile.float!.x), row: cell(tile.float!.y) };
}

// A snapped Overlay tile moves to a free Overlay spot; failing that, it becomes Free instead of
// being dropped — an invalid position is never a reason to lose the tile entirely.
function relocateOverlay(input: RelocateInput): ValidCandidate {
  const { candidate, board, tile, ctx } = input;
  const others = board.tiles.filter((candidateTile) => candidateTile.id !== tile.id && layerOf(candidateTile) === TileLayer.Overlay);
  const rest = board.tiles.filter((candidateTile) => candidateTile.id !== tile.id && layerOf(candidateTile) !== TileLayer.Overlay);
  const spot = findFreeSpace({ tiles: others.map(withFloatAsColRow), size: tile.size, grid: ctx.grid, sizeOf: (t) => t.size });
  const relocated = spot ? { ...tile, float: { x: spot.x, y: spot.y } } : toFreeInBounds(tile, ctx);
  return withTiles(candidate, board, [...rest, ...others, relocated]);
}

// Only called for an Overlay tile, which always has float set.
function toFreeInBounds(tile: Tile, ctx: EngineContext): Tile {
  const float = tile.float!;
  const clamped = clampRectToBoard(rectOfTile({ x: cell(float.x), y: cell(float.y) }, tile.size), ctx.grid);
  return { ...tile, float: { x: clamped.x, y: clamped.y, free: true } };
}

// Repairs an out-of-bounds or overlapping tile in place, layer by layer. Returns null only for a
// Grid tile with nowhere to go; the caller drops it then.
export function relocateInvalidTile(candidate: ValidCandidate, tileId: TileId, ctx: EngineContext): ValidCandidate | null {
  const board = candidate.boards.find((b) => b.tiles.some((tile) => tile.id === tileId));
  const tile = board?.tiles.find((candidateTile) => candidateTile.id === tileId);
  if (!board || !tile) return null;

  const input: RelocateInput = { candidate, board, tile, ctx };
  return layerOf(tile) === TileLayer.Overlay ? relocateOverlay(input) : relocateGrid(input);
}
