import type { BoardId } from '../shared/ids/BoardId.js';
import type { TileId } from '../shared/ids/TileId.js';
import type { WidgetId } from '../shared/ids/WidgetId.js';
import type { Cell } from '../shared/units/Cell.js';
import type { Size } from '../shared/sizes/Size.js';

// A tile's saved arrangement for one breakpoint's grid: everything about it that varies per
// breakpoint. Widget content (type, props, name) lives only on the live widgets, shared by all.
export interface LayoutTile {
  readonly tile: TileId;
  readonly board: BoardId;
  readonly col: Cell;
  readonly row: Cell;
  readonly size: Size;
  readonly float?: { readonly x: number; readonly y: number };
  // Parked on this grid: kept off the board here, while still showing on others.
  readonly hidden?: true;
  // The widgets this tile holds on this grid, and which one shows; absent in saves from before stacks varied by breakpoint.
  readonly items?: readonly WidgetId[];
  readonly active?: number;
}
