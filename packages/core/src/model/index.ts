// The data model: WidgetInstance < Tile < Board < BoardsState. BoardsState carries a
// type-only brand; only markValid may construct one, and only after validation.
export type { WidgetInstance } from './WidgetInstance.js';
export type { Tile } from './Tile.js';
export { isStack, isFloating, isFree, firstItem, activeItem } from './Tile.js';
export { TileLayer } from './TileLayer.js';
export { layerOf } from './layerOf.js';
export { cellOriginOf } from './cellOriginOf.js';
export type { Board } from './Board.js';
export { findBoard } from './findBoard.js';
export { findTile } from './findTile.js';
export type { LayoutTile } from './LayoutTile.js';
export type { BoardsState, ValidCandidate } from './BoardsState.js';
export { markValid } from './BoardsState.js';
export { STATE_VERSION } from './StateVersion.js';
export type { SerializedState } from './SerializedState.js';
