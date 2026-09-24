import { clampRectToBoard, rectOfTile } from '../../shared/geometry/Rect.js';
import { cell, err, ok, type BoardId, type Cell, type TileId } from '../../shared/index.js';
import { findBoard, isFree, type Board, type BoardsState, type Tile } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { placeOverlay } from '../primitives/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { Change } from '../outcome/Change.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

export interface MoveFloatingOp {
  readonly type: typeof OpType.MoveFloating;
  readonly board: BoardId;
  readonly tile: TileId;
  // Fractional cell units for a Free tile, which follows the pointer continuously; a snapped
  // Overlay tile rounds this to the nearest cell and solves like a grid Move.
  readonly to: { readonly x: number; readonly y: number };
}

export function moveFloating(op: MoveFloatingOp, ctx: EngineContext, state: BoardsState): OpOutcome {
  const board = findBoard(state, op.board);
  const tile = board?.tiles.find((candidate) => candidate.id === op.tile);
  if (!board || !tile) return err({ reason: RejectReason.UnknownTarget });
  if (!tile.float) return err({ reason: RejectReason.NotFloating });

  return isFree(tile) ? moveFree({ ctx, state, board, tile, to: op.to }) : moveOverlay({ ctx, state, board, tile, to: op.to });
}

interface MoveInput {
  readonly ctx: EngineContext;
  readonly state: BoardsState;
  readonly board: Board;
  readonly tile: Tile;
  readonly to: { readonly x: number; readonly y: number };
}

// Clamp to board edges, not reject; rejection mid-drag would freeze the tile.
function moveFree(input: MoveInput): OpOutcome {
  const { ctx, state, board, tile, to } = input;
  // The dispatcher already rejected a non-floating tile, so `float` is always set here.
  const float = tile.float!;
  const from = rectOfTile({ x: cell(float.x), y: cell(float.y) }, tile.size);
  const clamped = clampRectToBoard(rectOfTile({ x: cell(to.x), y: cell(to.y) }, tile.size), ctx.grid);
  const nextFloat = { x: clamped.x, y: clamped.y, free: true };
  const tiles = board.tiles.map((candidate) => (candidate.id === tile.id ? { ...candidate, float: nextFloat } : candidate));
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? { ...board, tiles } : candidate));
  const change: Change = { tile: tile.id, board: board.id, kind: ChangeKind.Moved, from, to: clamped };
  return ok({ candidate: { grid: state.grid, boards }, changes: [change] });
}

// Rejects rather than clamping: an impossible drop should not silently jump the tile elsewhere.
function moveOverlay(input: MoveInput): OpOutcome {
  const { ctx, state, board, tile, to } = input;
  const float = tile.float!;
  const from = rectOfTile({ x: cell(Math.round(float.x)), y: cell(Math.round(float.y)) }, tile.size);
  const at: { readonly x: Cell; readonly y: Cell } = { x: cell(Math.round(to.x)), y: cell(Math.round(to.y)) };
  const placed = placeOverlay({ board, tile, size: tile.size, at, ctx });
  if (!placed.ok) return placed;

  const change: Change = { tile: tile.id, board: board.id, kind: ChangeKind.Moved, from, to: rectOfTile(placed.value.at, tile.size) };
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? placed.value.board : candidate));
  return ok({ candidate: { grid: state.grid, boards }, changes: [change, ...placed.value.displaced] });
}
