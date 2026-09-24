// Provider: owns board state and provides it to everything below.
export { BoardProvider, defineBoards, createInitialState, useBoards, useLocked, useGrid, useBoardList, useWidgetCatalog, ChangeReason, DragFrom } from './provider/index.js';
export type {
  BoardsConfig,
  BoardsContextValue,
  BoardProviderProps,
  ChangeMeta,
  DefineBoardsInput,
  GridBreakpoint,
  ResolvedBreakpoint,
  InitialLayoutTile,
  BoardList,
  BoardListItem,
  WidgetCatalog,
  AddWidgetOptions,
} from './provider/index.js';

// Board: renders the active board's tiles onto a measured grid.
export { Board, useBoardTiles, useStackPicking } from './board/index.js';
export type { BoardProps, StackPicking } from './board/index.js';

// Tile: one tile's own state and actions, for a widget or host chrome to read.
export {
  useTile,
  useTileSize,
  useTileFloat,
  useTileStack,
  useTileName,
  useTileInteraction,
  useTileRemove,
  TilePickingMode,
  TileHeaderPlacement,
} from './tile/index.js';
export type {
  UseTileResult,
  UseTileSizeResult,
  TileSizeOption,
  UseTileFloatResult,
  UseTileStackResult,
  TileStackItem,
  UseTileNameResult,
  UseTileInteractionResult,
  UseTileRemoveResult,
  TileOverlayProps,
  TileOverlayComponent,
  TileHeaderProps,
  TileHeaderComponent,
} from './tile/index.js';

// Widget: how a host defines the widgets a board can place.
export { defineWidget, useWidget } from './widget/index.js';
export type { WidgetManifest, WidgetProps } from './widget/index.js';

// Shared: the size shorthand accepted anywhere a size is, and a drag-safe DOM prop.
export type { SizeInput } from './shared/size/SizeInput.js';
export type { AtInput } from './provider/config/AtInput.js';
export { noDragProps } from './shared/index.js';

// Rejections: a ready-to-show message for a dispatch the engine turned down.
export { describeRejection } from './reject/describeRejection.js';

// Re-exported from boardkit-core so a host never needs its own dependency on it.
export type { BoardsState, Tile, Size, Op, Rejection, Result, BoardId, TileId, WidgetId, Cell, Px } from 'boardkit-core';
export { OpType, RejectReason, boardId, tileId, widgetId, cell, px, findBoard, findTile } from 'boardkit-core';
