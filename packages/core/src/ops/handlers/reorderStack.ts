import { err, ok, type BoardId, type TileId } from '../../shared/index.js';
import { findBoard, type BoardsState, type WidgetInstance } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

// Not a pairwise swap; items shift between `from` and `to`.
export interface ReorderStackOp {
  readonly type: typeof OpType.ReorderStack;
  readonly board: BoardId;
  readonly tile: TileId;
  readonly from: number;
  readonly to: number;
}

function moveItem(items: readonly WidgetInstance[], from: number, to: number): readonly WidgetInstance[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (!moved) return items;
  next.splice(to, 0, moved);
  return next;
}

// Keeps `active` pointing at the same logical item through the shift the move above causes.
function moveActive(active: number, from: number, to: number): number {
  if (active === from) return to;
  if (from < to && active > from && active <= to) return active - 1;
  if (from > to && active >= to && active < from) return active + 1;
  return active;
}

// Geometry-free: only changes stack position, not tile location or size.
export function reorderStack(op: ReorderStackOp, _ctx: EngineContext, state: BoardsState): OpOutcome {
  const board = findBoard(state, op.board);
  const tile = board?.tiles.find((candidate) => candidate.id === op.tile);
  const inRange = (index: number) => index >= 0 && index < (tile?.items.length ?? 0);
  if (!board || !tile || !inRange(op.from) || !inRange(op.to)) return err({ reason: RejectReason.UnknownTarget });

  const items = moveItem(tile.items, op.from, op.to);
  const active = moveActive(tile.active, op.from, op.to);
  const tiles = board.tiles.map((candidate) => (candidate.id === tile.id ? { ...tile, items, active } : candidate));
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? { ...board, tiles } : candidate));
  const change = { tile: tile.id, board: board.id, kind: ChangeKind.Reordered };
  return ok({ candidate: { grid: state.grid, boards }, changes: [change] });
}
