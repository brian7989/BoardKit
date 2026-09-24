import { clampRectToBoard, rectOfTile } from '../../shared/geometry/Rect.js';
import type { Point } from '../../shared/geometry/Point.js';
import { cell, err, ok, isSizeAllowed, type BoardId, type Cell, type Size, type TileId } from '../../shared/index.js';
import { findBoard, layerOf, TileLayer, type Board, type Tile, type BoardsState } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { placeOverlay, placePinned } from '../primitives/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

export interface ResizeOp {
  readonly type: typeof OpType.Resize;
  readonly board: BoardId;
  readonly tile: TileId;
  readonly size: Size;
}

export function resize(op: ResizeOp, ctx: EngineContext, state: BoardsState): OpOutcome {
  const board = findBoard(state, op.board);
  const tile = board?.tiles.find((candidate) => candidate.id === op.tile);
  if (!board || !tile) return err({ reason: RejectReason.UnknownTarget });

  const supported = tile.items.every((item) => isSizeAllowed(op.size, ctx.catalog[item.type]?.sizes ?? []));
  if (!supported) return err({ reason: RejectReason.SizeNotAllowed });

  return layerOf(tile) === TileLayer.Overlay ? resizeOverlay({ ctx, state, board, tile, size: op.size }) : resizeGrounded({ ctx, state, board, tile, size: op.size });
}

interface ResizeInput {
  readonly ctx: EngineContext;
  readonly state: BoardsState;
  readonly board: Board;
  readonly tile: Tile;
  readonly size: Size;
}

function resizeGrounded(input: ResizeInput): OpOutcome {
  const { ctx, state, board, tile, size } = input;
  const from = rectOfTile({ x: tile.col, y: tile.row }, tile.size);
  const origin = positionForResize(tile, size, ctx);
  const resized: Tile = { ...tile, col: origin.x, row: origin.y, size };

  const placement = placePinned({ board, tile: resized, size, ctx });
  if (!placement.ok) return placement;

  const to = rectOfTile({ x: resized.col, y: resized.row }, size);
  const change = { tile: tile.id, board: board.id, kind: ChangeKind.Resized, from, to };
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? placement.value.board : candidate));
  return ok({ candidate: { grid: state.grid, boards }, changes: [change, ...placement.value.displaced] });
}

// Grows/shrinks in place within the Overlay layer, pushing other Overlay tiles as needed.
function resizeOverlay(input: ResizeInput): OpOutcome {
  const { ctx, state, board, tile, size } = input;
  const float = tile.float!; // only called for TileLayer.Overlay, which always has float set
  const from = rectOfTile({ x: cell(float.x), y: cell(float.y) }, tile.size);
  const at = { x: cell(float.x), y: cell(float.y) };

  const placement = placeOverlay({ board, tile, size, at, ctx });
  if (!placement.ok) return placement;

  const change = { tile: tile.id, board: board.id, kind: ChangeKind.Resized, from, to: rectOfTile(placement.value.at, size) };
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? placement.value.board : candidate));
  return ok({ candidate: { grid: state.grid, boards }, changes: [change, ...placement.value.displaced] });
}

// Grows in place, then nudges inward to stay on the board when configured to.
function positionForResize(tile: Tile, size: Size, ctx: EngineContext): Point<Cell> {
  const grown = { x: tile.col, y: tile.row, w: size.w, h: size.h };
  return ctx.solver.nudgeOnResize ? clampRectToBoard(grown, ctx.grid) : grown;
}
