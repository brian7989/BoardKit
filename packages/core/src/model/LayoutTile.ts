import type { BoardId } from '../shared/ids/BoardId.js';
import type { TileId } from '../shared/ids/TileId.js';
import type { Cell } from '../shared/units/Cell.js';
import type { Size } from '../shared/sizes/Size.js';

// A tile's saved position for one breakpoint's grid: everything about it that varies per
// breakpoint. Identity and content (items) live only on the live Tile, shared across all of them.
export interface LayoutTile {
  readonly tile: TileId;
  readonly board: BoardId;
  readonly col: Cell;
  readonly row: Cell;
  readonly size: Size;
  readonly float?: { readonly x: number; readonly y: number };
}
