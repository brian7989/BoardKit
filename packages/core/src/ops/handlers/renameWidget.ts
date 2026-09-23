import { err, ok, type BoardId, type TileId, type WidgetId } from '../../shared/index.js';
import { findBoard, type BoardsState, type WidgetInstance } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

export interface RenameWidgetOp {
  readonly type: typeof OpType.RenameWidget;
  readonly board: BoardId;
  readonly tile: TileId;
  readonly widget: WidgetId;
  readonly name: string;
}

// exactOptionalPropertyTypes requires omitting the key, not setting undefined.
function withName(item: WidgetInstance, name: string): WidgetInstance {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    const { id, type, props } = item;
    return { id, type, ...(props ? { props } : {}) };
  }
  return { ...item, displayName: trimmed };
}

export function renameWidget(op: RenameWidgetOp, _ctx: EngineContext, state: BoardsState): OpOutcome {
  const board = findBoard(state, op.board);
  const tile = board?.tiles.find((candidate) => candidate.id === op.tile);
  const exists = tile?.items.some((item) => item.id === op.widget);
  if (!board || !tile || !exists) return err({ reason: RejectReason.UnknownTarget });

  const items = tile.items.map((item) => (item.id === op.widget ? withName(item, op.name) : item));
  const tiles = board.tiles.map((candidate) => (candidate.id === tile.id ? { ...tile, items } : candidate));
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? { ...board, tiles } : candidate));
  const change = { tile: tile.id, board: board.id, kind: ChangeKind.Renamed };
  return ok({ candidate: { grid: state.grid, boards }, changes: [change] });
}
