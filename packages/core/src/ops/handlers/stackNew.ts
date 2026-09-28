import { err, isSizeAllowed, ok, type BoardId, type TileId } from '../../shared/index.js';
import { findBoard, type BoardsState, type WidgetInstance } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

export interface StackNewOp {
  readonly type: typeof OpType.StackNew;
  readonly board: BoardId;
  readonly onto: TileId;
  readonly widget: WidgetInstance;
}

// Joins the tile's own stack, so it needs no grid space; it becomes the widget showing.
export function stackNew(op: StackNewOp, ctx: EngineContext, state: BoardsState): OpOutcome {
  const board = findBoard(state, op.board);
  const tile = board?.tiles.find((candidate) => candidate.id === op.onto);
  if (!board || !tile) return err({ reason: RejectReason.UnknownTarget });
  const manifest = ctx.catalog[op.widget.type];
  if (!manifest || !isSizeAllowed(tile.size, manifest.sizes)) return err({ reason: RejectReason.SizeNotAllowed });

  const items = [...tile.items, op.widget];
  const tiles = board.tiles.map((candidate) => (candidate.id === tile.id ? { ...tile, items, active: items.length - 1 } : candidate));
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? { ...board, tiles } : candidate));
  return ok({ candidate: { grid: state.grid, boards }, changes: [{ tile: tile.id, board: board.id, kind: ChangeKind.Stacked }] });
}
