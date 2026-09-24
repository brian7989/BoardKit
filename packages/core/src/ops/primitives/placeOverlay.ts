import { rectContains, rectOfTile, type Rect } from '../../shared/geometry/Rect.js';
import type { Point } from '../../shared/geometry/Point.js';
import { cell, type Cell, type Size } from '../../shared/index.js';
import { layerOf, TileLayer, type Board, type Tile } from '../../model/index.js';
import type { EngineContext } from '../../engine/EngineContext.js';
import { relocateTiles, findFreeSpace } from '../../solver/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { Change } from '../outcome/Change.js';
import type { Rejection } from '../outcome/Rejection.js';

export interface PlaceOverlayInput {
  readonly board: Board;
  readonly tile: Tile;
  readonly size: Size;
  readonly at: Point<Cell>;
  readonly ctx: EngineContext;
}

export interface PlaceOverlayResult {
  readonly board: Board;
  readonly displaced: readonly Change[];
  readonly at: Point<Cell>;
}

type PlaceOverlayOutcome = { readonly ok: true; readonly value: PlaceOverlayResult } | { readonly ok: false; readonly error: Rejection };

// Places `tile` into the Overlay layer: tries the requested cell first (pushing other Overlay
// tiles like a grid Move), then falls back to any free Overlay spot. Grid/Free tiles never collide.
export function placeOverlay(input: PlaceOverlayInput): PlaceOverlayOutcome {
  const { board, tile, size, at, ctx } = input;
  const rest = board.tiles.filter((candidate) => candidate.id !== tile.id && layerOf(candidate) !== TileLayer.Overlay);
  const overlayOthers = board.tiles.filter((candidate) => candidate.id !== tile.id && layerOf(candidate) === TileLayer.Overlay);

  const pinnedRect = rectOfTile(at, size);
  const asGrid = overlayOthers.map(withFloatAsColRow);
  const solved = fitsBoard(pinnedRect, ctx) ? solve({ tiles: asGrid, pinnedTileId: tile.id, pinnedRect, ctx }) : null;
  if (solved) return { ok: true, value: place({ board, rest, overlayOthers, tile, size, at, positions: solved, boardId: board.id }) };

  // findFreeSpace also reads col/row as the position, same as relocateTiles above.
  const spot = findFreeSpace({ tiles: asGrid, size, grid: ctx.grid, sizeOf: (candidate) => candidate.size });
  if (!spot) return { ok: false, error: { reason: RejectReason.NoFreeSpace } };
  return { ok: true, value: place({ board, rest, overlayOthers, tile, size, at: spot, positions: null, boardId: board.id }) };
}

// An Overlay tile's real spot lives in float.x/y (always set — it's how it got in this layer);
// the generic grid solver reads col/row.
function withFloatAsColRow(tile: Tile): Tile {
  return { ...tile, col: cell(tile.float!.x), row: cell(tile.float!.y) };
}

function fitsBoard(rect: Rect<Cell>, ctx: EngineContext): boolean {
  const boardRect: Rect<Cell> = { x: cell(0), y: cell(0), w: cell(ctx.grid.cols), h: cell(ctx.grid.rows) };
  return rectContains(boardRect, rect);
}

interface SolveInput {
  readonly tiles: readonly Tile[];
  readonly pinnedTileId: Tile['id'];
  readonly pinnedRect: Rect<Cell>;
  readonly ctx: EngineContext;
}

function solve(input: SolveInput): ReadonlyMap<Tile['id'], Rect<Cell>> | null {
  const { tiles, pinnedTileId, pinnedRect, ctx } = input;
  const relocation = relocateTiles({ tiles, pinnedTileId, pinnedRect, grid: ctx.grid, sizeOf: (candidate) => candidate.size, options: ctx.solver });
  return relocation.ok ? relocation.value : null;
}

interface PlaceInput {
  readonly board: Board;
  readonly rest: readonly Tile[];
  readonly overlayOthers: readonly Tile[];
  readonly tile: Tile;
  readonly size: Size;
  readonly at: Point<Cell>;
  readonly positions: ReadonlyMap<Tile['id'], Rect<Cell>> | null;
  readonly boardId: Board['id'];
}

function place(input: PlaceInput): PlaceOverlayResult {
  const { board, rest, overlayOthers, tile, size, at, positions, boardId } = input;
  const displaced: Change[] = [];
  const others = overlayOthers.map((existing) => {
    const next = positions?.get(existing.id);
    if (!next) return existing;
    const from = rectOfTile({ x: cell(existing.float!.x), y: cell(existing.float!.y) }, next);
    displaced.push({ tile: existing.id, board: boardId, kind: ChangeKind.Moved, from, to: next });
    return { ...existing, float: { x: next.x, y: next.y } };
  });
  const placed: Tile = { ...tile, size, float: { x: at.x, y: at.y } };
  return { board: { ...board, tiles: [...rest, ...others, placed] }, displaced, at };
}
