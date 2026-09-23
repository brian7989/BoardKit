import { rectOfTile } from '../../shared/geometry/Rect.js';
import { cell, err, ok, type BoardId, type TileId, type WidgetId } from '../../shared/index.js';
import { findBoard, activeItem, isStack, type BoardsState, type Tile, type WidgetInstance } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { detach, placeFree } from '../primitives/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { Change } from '../outcome/Change.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

export interface UnstackOp {
  readonly type: typeof OpType.Unstack;
  readonly board: BoardId;
  readonly tile: TileId;
  readonly newTile: TileId;
  // Defaults to the currently active item when omitted — a UI that only shows one item at a
  // time (e.g. cycling arrows) never needs to name one explicitly.
  readonly widget?: WidgetId;
}

function resolveItem(tile: Tile, widget: UnstackOp['widget']): WidgetInstance | undefined {
  return widget ? tile.items.find((candidate) => candidate.id === widget) : activeItem(tile);
}

// Items already support stack size; no further manifest check needed.
export function unstack(op: UnstackOp, ctx: EngineContext, state: BoardsState): OpOutcome {
  const board = findBoard(state, op.board);
  const tile = board?.tiles.find((candidate) => candidate.id === op.tile);
  if (!board || !tile) return err({ reason: RejectReason.UnknownTarget });
  if (!isStack(tile)) return err({ reason: RejectReason.StackIncompatible });

  const item = resolveItem(tile, op.widget);
  if (!item) return err({ reason: RejectReason.UnknownTarget });

  const detachedBoard = detach(board, tile.id, item.id);
  const popped: Tile = { id: op.newTile, col: cell(0), row: cell(0), size: tile.size, items: [item], active: 0 };
  const placement = placeFree({ board: detachedBoard, tile: popped, size: tile.size, ctx });
  if (!placement.ok) return placement;

  const added = placement.value.tiles.find((candidate) => candidate.id === op.newTile);
  if (!added) throw new Error('placeFree did not add the expected tile.');
  const changes: Change[] = [
    { tile: op.tile, board: board.id, kind: ChangeKind.Unstacked },
    { tile: op.newTile, board: board.id, kind: ChangeKind.Added, to: rectOfTile({ x: added.col, y: added.row }, tile.size) },
  ];
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? placement.value : candidate));
  return ok({ candidate: { grid: state.grid, boards }, changes });
}
