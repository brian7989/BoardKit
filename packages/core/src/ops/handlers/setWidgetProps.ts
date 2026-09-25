import { err, ok, type BoardId, type TileId, type WidgetId } from '../../shared/index.js';
import { findBoard, type BoardsState, type WidgetInstance } from '../../model/index.js';
import type { EngineContext } from '../../engine/index.js';
import { ChangeKind } from '../outcome/ChangeKind.js';
import { RejectReason } from '../outcome/RejectReason.js';
import type { OpOutcome } from '../OpHandler.js';
import { OpType } from '../OpType.js';

export interface SetWidgetPropsOp {
  readonly type: typeof OpType.SetWidgetProps;
  readonly board: BoardId;
  readonly tile: TileId;
  readonly widget: WidgetId;
  // Shallow-merged into the widget's current props.
  readonly props: Readonly<Record<string, unknown>>;
}

function withProps(item: WidgetInstance, patch: Readonly<Record<string, unknown>>): WidgetInstance {
  return { ...item, props: { ...item.props, ...patch } };
}

export function setWidgetProps(op: SetWidgetPropsOp, _ctx: EngineContext, state: BoardsState): OpOutcome {
  const board = findBoard(state, op.board);
  const tile = board?.tiles.find((candidate) => candidate.id === op.tile);
  const exists = tile?.items.some((item) => item.id === op.widget);
  if (!board || !tile || !exists) return err({ reason: RejectReason.UnknownTarget });

  const items = tile.items.map((item) => (item.id === op.widget ? withProps(item, op.props) : item));
  const tiles = board.tiles.map((candidate) => (candidate.id === tile.id ? { ...tile, items } : candidate));
  const boards = state.boards.map((candidate) => (candidate.id === board.id ? { ...board, tiles } : candidate));
  const change = { tile: tile.id, board: board.id, kind: ChangeKind.PropsChanged };
  return ok({ candidate: { grid: state.grid, boards }, changes: [change] });
}
