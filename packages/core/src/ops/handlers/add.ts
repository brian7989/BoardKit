import { clampRectToBoard, rectOfTile } from '../../shared/geometry/Rect.js';
import type { Point } from '../../shared/geometry/Point.js';
import { cell, err, ok, isSizeAllowed, type BoardId, type Cell, type Result, type Size, type TileId } from '../../shared/index.js';
import { findBoard, isFloating, type Board, type BoardsState, type Tile, type WidgetInstance } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { findFreeSpace } from '../../solver/index.js';
import { placeFree, placePinned } from '../primitives/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { Change } from '../outcome/Change.js';
import type { Rejection } from '../outcome/Rejection.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

export interface AddOp {
  readonly type: typeof OpType.Add;
  readonly board: BoardId;
  readonly tileId: TileId;
  readonly widget: WidgetInstance;
  readonly size: Size;
  readonly at?: Point<Cell>;
  // Adds the tile already floating at this fractional position, instead of onto the grid.
  readonly float?: { readonly x: number; readonly y: number };
}

export function add(op: AddOp, ctx: EngineContext, state: BoardsState): OpOutcome {
  const board = findBoard(state, op.board);
  if (!board) return err({ reason: RejectReason.UnknownTarget });

  const manifest = ctx.catalog[op.widget.type];
  if (!manifest || !isSizeAllowed(op.size, manifest.sizes)) {
    return err({ reason: RejectReason.SizeNotAllowed });
  }

  if (op.float) return addFloating({ op, float: op.float, ctx, state, board });

  const tile: Tile = { id: op.tileId, col: cell(0), row: cell(0), size: op.size, items: [op.widget], active: 0 };
  const placement = placeTile({ board, tile, size: op.size, ctx, ...(op.at ? { at: op.at } : {}) });
  if (!placement.ok) return placement;

  const added = placement.value.board.tiles.find((candidate) => candidate.id === op.tileId);
  if (!added) throw new Error('placeTile did not add the expected tile.');
  const change: Change = { tile: op.tileId, board: board.id, kind: ChangeKind.Added, to: rectOfTile({ x: added.col, y: added.row }, op.size) };
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? placement.value.board : candidate));
  return ok({ candidate: { grid: state.grid, boards }, changes: [change, ...placement.value.displaced] });
}

// A spot for when the tile later un-floats, not real occupancy — floating tiles never block others.
function floatingOrigin(board: Board, size: Size, ctx: EngineContext): Point<Cell> {
  const spot = findFreeSpace({
    tiles: board.tiles.filter((candidate) => !isFloating(candidate)),
    size,
    grid: { cols: ctx.grid.cols, rows: ctx.grid.rows },
    sizeOf: (candidate) => candidate.size,
  });
  return spot ?? { x: cell(0), y: cell(0) };
}

function clampFloat(float: { readonly x: number; readonly y: number }, size: Size, ctx: EngineContext): { readonly x: number; readonly y: number } {
  const clamped = clampRectToBoard(rectOfTile({ x: cell(float.x), y: cell(float.y) }, size), ctx.grid);
  return { x: clamped.x, y: clamped.y };
}

interface AddFloatingInput {
  readonly op: AddOp;
  readonly float: { readonly x: number; readonly y: number };
  readonly ctx: EngineContext;
  readonly state: BoardsState;
  readonly board: Board;
}

// Floating tiles don't occupy the grid, so this skips the solver entirely; clamping (not
// rejecting) mirrors moveFloating — an out-of-range drop still lands, just pulled onto the board.
function addFloating(input: AddFloatingInput): OpOutcome {
  const { op, ctx, state, board } = input;
  const origin = floatingOrigin(board, op.size, ctx);
  const float = clampFloat(input.float, op.size, ctx);
  const tile: Tile = { id: op.tileId, col: origin.x, row: origin.y, size: op.size, items: [op.widget], active: 0, float };
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? { ...board, tiles: [...board.tiles, tile] } : candidate));
  const to = rectOfTile({ x: cell(Math.round(float.x)), y: cell(Math.round(float.y)) }, op.size);
  const change: Change = { tile: op.tileId, board: board.id, kind: ChangeKind.Added, to };
  return ok({ candidate: { grid: state.grid, boards }, changes: [change] });
}

interface Placed {
  readonly board: Board;
  readonly displaced: readonly Change[];
}

interface PlaceTileInput {
  readonly board: Board;
  readonly tile: Tile;
  readonly size: Size;
  readonly ctx: EngineContext;
  readonly at?: Point<Cell>;
}

function placeTile(input: PlaceTileInput): Result<Placed, Rejection> {
  const { board, tile, size, ctx, at } = input;
  if (at) return placePinned({ board, tile: { ...tile, col: at.x, row: at.y }, size, ctx });
  const placed = placeFree({ board, tile, size, ctx });
  return placed.ok ? ok({ board: placed.value, displaced: [] }) : placed;
}
