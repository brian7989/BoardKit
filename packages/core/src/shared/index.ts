// Branded identifiers, units, geometry, and Result type. No domain knowledge.
export type { BoardId } from './ids/BoardId.js';
export { boardId } from './ids/BoardId.js';
export type { TileId } from './ids/TileId.js';
export { tileId } from './ids/TileId.js';
export type { WidgetId } from './ids/WidgetId.js';
export { widgetId } from './ids/WidgetId.js';
export type { Cell } from './units/Cell.js';
export { cell } from './units/Cell.js';
export type { Px } from './units/Px.js';
export { px } from './units/Px.js';
export type { Result } from './result/Result.js';
export { ok, err } from './result/Result.js';
export type { Point } from './geometry/Point.js';
export type { Rect } from './geometry/Rect.js';
export { rectOfTile, rectsIntersect, rectContains } from './geometry/Rect.js';
export type { Size } from './sizes/Size.js';
export { sizesEqual, isSizeAllowed } from './sizes/Size.js';
export type { ValueOf } from './unions/ValueOf.js';
