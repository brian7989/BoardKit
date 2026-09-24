import { cell, err, ok, type BoardId, type TileId } from '../../shared/index.js';
import { findBoard, isFree, type Board, type BoardsState, type Tile } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { placeOverlay } from '../primitives/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { Change } from '../outcome/Change.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

export interface SetFloatFreeOp {
  readonly type: typeof OpType.SetFloatFree;
  readonly board: BoardId;
  readonly tile: TileId;
  readonly free: boolean;
}

/** Moves a floating tile between the snapped Overlay layer and unsnapped Free. */
export function setFloatFree(op: SetFloatFreeOp, ctx: EngineContext, state: BoardsState): OpOutcome {
  const board = findBoard(state, op.board);
  const tile = board?.tiles.find((candidate) => candidate.id === op.tile);
  if (!board || !tile || !tile.float) return err({ reason: RejectReason.UnknownTarget });
  if (isFree(tile) === op.free) return ok({ candidate: { grid: state.grid, boards: state.boards }, changes: [] });

  return op.free ? toFree({ state, board, tile }) : toOverlay({ ctx, state, board, tile });
}

interface ToFreeInput {
  readonly state: BoardsState;
  readonly board: Board;
  readonly tile: Tile;
}

// Snapped → free just sets the flag; the tile's position is already valid anywhere on the board.
function toFree(input: ToFreeInput): OpOutcome {
  const { state, board, tile } = input;
  const float = { x: tile.float!.x, y: tile.float!.y, free: true };
  const tiles = board.tiles.map((candidate) => (candidate.id === tile.id ? { ...candidate, float } : candidate));
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? { ...board, tiles } : candidate));
  const change: Change = { tile: tile.id, board: board.id, kind: ChangeKind.Freed };
  return ok({ candidate: { grid: state.grid, boards }, changes: [change] });
}

interface ToOverlayInput {
  readonly ctx: EngineContext;
  readonly state: BoardsState;
  readonly board: Board;
  readonly tile: Tile;
}

// Free → snapped rounds the position and places it via the Overlay solver, falling back to a
// free Overlay spot, else rejecting.
function toOverlay(input: ToOverlayInput): OpOutcome {
  const { ctx, state, board, tile } = input;
  const float = tile.float!;
  const at = { x: cell(Math.round(float.x)), y: cell(Math.round(float.y)) };
  const placed = placeOverlay({ board, tile, size: tile.size, at, ctx });
  if (!placed.ok) return placed;

  const boards = state.boards.map((candidate) => (candidate.id === board.id ? placed.value.board : candidate));
  const change: Change = { tile: tile.id, board: board.id, kind: ChangeKind.Snapped };
  return ok({ candidate: { grid: state.grid, boards }, changes: [change, ...placed.value.displaced] });
}
