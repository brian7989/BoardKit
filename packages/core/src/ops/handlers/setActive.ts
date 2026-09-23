import { err, ok, type BoardId, type TileId } from '../../shared/index.js';
import { findBoard, type BoardsState } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

export interface SetActiveOp {
  readonly type: typeof OpType.SetActive;
  readonly board: BoardId;
  readonly tile: TileId;
  readonly index: number;
}

// Geometry-free: cycling which stack member shows never moves or resizes anything.
export function setActive(op: SetActiveOp, _ctx: EngineContext, state: BoardsState): OpOutcome {
  const board = findBoard(state, op.board);
  const tile = board?.tiles.find((candidate) => candidate.id === op.tile);
  const inRange = tile && op.index >= 0 && op.index < tile.items.length;
  if (!board || !tile || !inRange) return err({ reason: RejectReason.UnknownTarget });

  const tiles = board.tiles.map((candidate) => (candidate.id === tile.id ? { ...tile, active: op.index } : candidate));
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? { ...board, tiles } : candidate));
  const change = { tile: tile.id, board: board.id, kind: ChangeKind.Activated };
  return ok({ candidate: { grid: state.grid, boards }, changes: [change] });
}
