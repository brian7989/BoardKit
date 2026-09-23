import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  findBoard,
  isStack,
  OpType,
  sizesEqual,
  tileId,
  type Applied,
  type BoardId,
  type BoardsState,
  type Rejection,
  type Result,
  type Tile,
  type TileId,
  type WidgetId,
} from 'boardkit-core';
import type { TilePickingMode } from '../internal/TilePickingMode.js';
import { useBoardsConfig } from '../../provider/internal/useBoardsConfig.js';
import type { Dispatch } from '../../provider/internal/useDispatch.js';
import { displayNameOf } from '../../widget/index.js';
import type { WidgetManifest } from '../../widget/index.js';
import { useStackPicker } from '../../board/stackPicking/useStackPicker.js';
import { useTilePickingMode } from '../internal/useTilePickingMode.js';

/** One widget stacked on a tile: its id, display name, position, and whether it's the active one. */
export interface TileStackItem {
  readonly id: WidgetId;
  readonly name: string;
  readonly index: number;
  readonly isActive: boolean;
}

interface UseTileStackItemsResult {
  readonly isStack: boolean;
  readonly items: readonly TileStackItem[];
  readonly active: TileStackItem | undefined;
}

function toItems(tile: Tile, widgets: ReadonlyMap<string, WidgetManifest>): readonly TileStackItem[] {
  return tile.items.map((item, index) => ({ id: item.id, name: displayNameOf(item, widgets.get(item.type)), index, isActive: index === tile.active }));
}

// tile.active is a plain number, not statically tied to a real index, so `active` may be undefined.
function useTileStackItems(tile: Tile): UseTileStackItemsResult {
  const { widgets } = useBoardsConfig();
  const items = toItems(tile, widgets);

  return { isStack: isStack(tile), items, active: items.find((item) => item.isActive) };
}

interface TileStackActions {
  readonly select: (widget: WidgetId) => Result<Applied, Rejection>;
  readonly unstack: (widget: WidgetId) => Result<Applied, Rejection>;
  readonly reorder: (widget: WidgetId, toIndex: number) => Result<Applied, Rejection>;
  readonly renameItem: (widget: WidgetId, name: string) => Result<Applied, Rejection>;
}

interface UseTileStackActionsInput {
  readonly tile: Tile;
  readonly board: BoardId;
  readonly dispatch: Dispatch;
  readonly createId: () => string;
}

function indexOf(tile: Tile, widget: WidgetId): number {
  return tile.items.findIndex((item) => item.id === widget);
}

// An out-of-range index goes straight to the engine, which already rejects it cleanly.
function useTileStackActions(input: UseTileStackActionsInput): TileStackActions {
  const { tile, board, dispatch, createId } = input;
  const select = useCallback(
    (widget: WidgetId) => dispatch({ type: OpType.SetActive, board, tile: tile.id, index: indexOf(tile, widget) }),
    [dispatch, board, tile],
  );
  const unstack = useCallback(
    (widget: WidgetId) => dispatch({ type: OpType.Unstack, board, tile: tile.id, newTile: tileId(createId()), widget }),
    [dispatch, board, tile.id, createId],
  );
  const reorder = useCallback(
    (widget: WidgetId, toIndex: number) => dispatch({ type: OpType.ReorderStack, board, tile: tile.id, from: indexOf(tile, widget), to: toIndex }),
    [dispatch, board, tile],
  );
  const renameItem = useCallback(
    (widget: WidgetId, name: string) => dispatch({ type: OpType.RenameWidget, board, tile: tile.id, widget, name }),
    [dispatch, board, tile.id],
  );

  return { select, unstack, reorder, renameItem };
}

interface UseTileCombineResult {
  readonly canCombine: boolean;
  readonly combineWith: (target: TileId) => Result<Applied, Rejection>;
  readonly startPicking: () => void;
}

interface CanCombineInput {
  readonly state: BoardsState;
  readonly board: BoardId;
  readonly tile: Tile;
}

// Selected via useSyncExternalStore so a tile re-renders only when this boolean flips.
function hasSameSizeSibling(input: CanCombineInput): boolean {
  const board = findBoard(input.state, input.board);
  return board !== undefined && board.tiles.some((candidate) => candidate.id !== input.tile.id && sizesEqual(candidate.size, input.tile.size));
}

function useTileCombine(tile: Tile): UseTileCombineResult {
  const { activeBoardId, dispatch, getState, subscribeState } = useBoardsConfig();
  const getCanCombine = () => hasSameSizeSibling({ state: getState(), board: activeBoardId, tile });
  const canCombine = useSyncExternalStore(subscribeState, getCanCombine, getCanCombine);
  const picker = useStackPicker();

  const combineWith = useCallback(
    (target: TileId) => dispatch({ type: OpType.Stack, board: activeBoardId, from: tile.id, onto: target }),
    [dispatch, activeBoardId, tile.id],
  );
  const startPicking = useCallback(() => picker?.startPicking(tile.id), [picker, tile.id]);

  return { canCombine, combineWith, startPicking };
}

/** The result of `useTileStack`: the tile's stacked items, plus actions to manage them. */
export interface UseTileStackResult {
  readonly isStack: boolean;
  readonly items: readonly TileStackItem[];
  readonly active: TileStackItem | undefined;
  readonly select: (widget: WidgetId) => Result<Applied, Rejection>;
  readonly unstack: (widget: WidgetId) => Result<Applied, Rejection>;
  readonly reorder: (widget: WidgetId, toIndex: number) => Result<Applied, Rejection>;
  readonly renameItem: (widget: WidgetId, name: string) => Result<Applied, Rejection>;
  readonly combineWith: (target: TileId) => Result<Applied, Rejection>;
  readonly canCombine: boolean;
  readonly startPicking: () => void;
  readonly pickingMode: TilePickingMode;
}

/** Structural state and actions for a tile's stack: members, active item, and combine/picking controls. */
export function useTileStack(tile: Tile): UseTileStackResult {
  const { activeBoardId, dispatch, createId } = useBoardsConfig();
  const items = useTileStackItems(tile);
  const actions = useTileStackActions({ tile, board: activeBoardId, dispatch, createId });
  const combine = useTileCombine(tile);
  const pickingMode = useTilePickingMode(tile).mode;

  return useMemo<UseTileStackResult>(
    () => ({ ...items, ...actions, ...combine, pickingMode }),
    [items, actions, combine, pickingMode],
  );
}
