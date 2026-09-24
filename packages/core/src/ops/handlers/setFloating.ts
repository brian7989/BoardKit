import { cell, err, ok, type BoardId, type TileId } from '../../shared/index.js';
import { findBoard, isFloating, type Board, type BoardsState, type Tile } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { placeOverlay, placePinned } from '../primitives/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { Change } from '../outcome/Change.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

export interface SetFloatingOp {
  readonly type: typeof OpType.SetFloating;
  readonly board: BoardId;
  readonly tile: TileId;
  readonly floating: boolean;
}

// Turning floating on/off twice is a no-op, not a rejection — a host toggling from a menu
// shouldn't have to track current state just to avoid an error.
export function setFloating(op: SetFloatingOp, ctx: EngineContext, state: BoardsState): OpOutcome {
  const board = findBoard(state, op.board);
  const tile = board?.tiles.find((candidate) => candidate.id === op.tile);
  if (!board || !tile) return err({ reason: RejectReason.UnknownTarget });

  return op.floating ? startFloating({ ctx, state, board, tile }) : stopFloating({ ctx, state, board, tile });
}

interface StartFloatingInput {
  readonly ctx: EngineContext;
  readonly state: BoardsState;
  readonly board: Board;
  readonly tile: Tile;
}

// Already floating (Overlay or Free) is a no-op; a grid tile enters the Overlay layer at its
// current cell, resolved with the solver, falling back to a free Overlay spot.
function startFloating(input: StartFloatingInput): OpOutcome {
  const { ctx, state, board, tile } = input;
  if (isFloating(tile)) return ok({ candidate: { grid: state.grid, boards: state.boards }, changes: [] });

  const placed = placeOverlay({ board, tile, size: tile.size, at: { x: tile.col, y: tile.row }, ctx });
  if (!placed.ok) return placed;

  const boards = state.boards.map((candidate) => (candidate.id === board.id ? placed.value.board : candidate));
  const change: Change = { tile: tile.id, board: board.id, kind: ChangeKind.Floated };
  return ok({ candidate: { grid: state.grid, boards }, changes: [change, ...placed.value.displaced] });
}

interface StopFloatingInput {
  readonly ctx: EngineContext;
  readonly state: BoardsState;
  readonly board: Board;
  readonly tile: Tile;
}

// Rejoining the grid runs through the same solver placePinned uses for an ordinary move — the
// rounded spot might now be occupied, and displacing whatever's there is expected.
function stopFloating(input: StopFloatingInput): OpOutcome {
  const { ctx, state, board, tile } = input;
  if (!tile.float) return ok({ candidate: { grid: state.grid, boards: state.boards }, changes: [] });

  const { float: _float, ...grounded } = tile;
  const target: Tile = { ...grounded, col: cell(Math.round(tile.float.x)), row: cell(Math.round(tile.float.y)) };
  const placement = placePinned({ board, tile: target, size: tile.size, ctx });
  if (!placement.ok) return placement;

  const change: Change = { tile: tile.id, board: board.id, kind: ChangeKind.Unfloated };
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? placement.value.board : candidate));
  return ok({ candidate: { grid: state.grid, boards }, changes: [change, ...placement.value.displaced] });
}
