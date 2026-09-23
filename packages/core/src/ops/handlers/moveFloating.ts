import { clampRectToBoard, rectOfTile } from '../../shared/geometry/Rect.js';
import { cell, err, ok, type BoardId, type TileId } from '../../shared/index.js';
import { findBoard, type BoardsState } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { Change } from '../outcome/Change.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

export interface MoveFloatingOp {
  readonly type: typeof OpType.MoveFloating;
  readonly board: BoardId;
  readonly tile: TileId;
  // Fractional cell units, not the integer Cell a grid MoveOp uses — a float follows the
  // pointer continuously, it never snaps.
  readonly to: { readonly x: number; readonly y: number };
}

// Clamp to board edges, not reject; rejection mid-drag would freeze the tile.
export function moveFloating(op: MoveFloatingOp, ctx: EngineContext, state: BoardsState): OpOutcome {
  const board = findBoard(state, op.board);
  const tile = board?.tiles.find((candidate) => candidate.id === op.tile);
  if (!board || !tile) return err({ reason: RejectReason.UnknownTarget });
  if (!tile.float) return err({ reason: RejectReason.NotFloating });

  const from = rectOfTile({ x: cell(tile.float.x), y: cell(tile.float.y) }, tile.size);
  const to = clampRectToBoard(rectOfTile({ x: cell(op.to.x), y: cell(op.to.y) }, tile.size), ctx.grid);
  const float = { x: to.x, y: to.y };
  const tiles = board.tiles.map((candidate) => (candidate.id === tile.id ? { ...candidate, float } : candidate));
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? { ...board, tiles } : candidate));
  const change: Change = { tile: tile.id, board: board.id, kind: ChangeKind.Moved, from, to };
  return ok({ candidate: { grid: state.grid, boards }, changes: [change] });
}
