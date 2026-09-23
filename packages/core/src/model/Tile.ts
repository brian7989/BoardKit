import type { TileId } from '../shared/ids/TileId.js';
import type { Size } from '../shared/sizes/Size.js';
import type { Cell } from '../shared/units/Cell.js';
import type { WidgetInstance } from './WidgetInstance.js';

/** One placed tile: its position, size, and the widget instance(s) stacked on it. */
export interface Tile {
  readonly id: TileId;
  readonly col: Cell;
  readonly row: Cell;
  readonly size: Size;
  readonly items: readonly WidgetInstance[];
  readonly active: number;
  // Present only while floating; col/row still hold the last grid position for re-placement when floating turns off.
  readonly float?: { readonly x: number; readonly y: number };
}

export function isStack(tile: Tile): boolean {
  return tile.items.length > 1;
}

export function isFloating(tile: Tile): boolean {
  return tile.float !== undefined;
}

export function firstItem(tile: Tile): WidgetInstance {
  const item = tile.items[0];
  if (!item) throw new Error('Invalid tile: items must be non-empty.');
  return item;
}

export function activeItem(tile: Tile): WidgetInstance {
  const item = tile.items[tile.active];
  return item ?? firstItem(tile);
}
