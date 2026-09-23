import type { Rect } from '../../../shared/geometry/Rect.js';
import type { Cell } from '../../../shared/units/Cell.js';
import type { Size } from '../../../shared/sizes/Size.js';
import type { TileId } from '../../../shared/ids/TileId.js';
import type { Tile } from '../../../model/Tile.js';
import type { Direction } from '../cost/Direction.js';

// Mutable, search-scoped board shared by one relocateTiles() search: original occupancy is
// read-only, pinned+placed occupancy and the discovery queue are mutated with enter/exit.
export interface RelocationBoard {
  readonly cols: number;
  readonly rows: number;
  readonly owner: Int32Array; // original occupant index+1 per cell, 0 = free; never mutated
  readonly blocked: Uint8Array; // 1 = pinned or currently-placed cell
  readonly resolved: Uint8Array; // 1 = tile already queued (about to move) or placed
  readonly placedRect: Array<Rect<Cell> | null>; // per tile index, once it has a new position
  readonly queue: number[]; // FIFO of tile indices; grows via push, shrinks via `head`
  head: number;
  readonly tiles: readonly Tile[]; // index -> original tile
  readonly tileIds: readonly TileId[]; // index -> id
  readonly size: readonly Size[]; // index -> that tile's size
  readonly order: readonly Direction[]; // preferred push directions, for tie-breaking
}
