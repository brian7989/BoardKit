import type { Rect } from '../../shared/geometry/Rect.js';
import type { Cell } from '../../shared/units/Cell.js';
import type { Size } from '../../shared/sizes/Size.js';
import type { Tile } from '../../model/Tile.js';
import type { TileId } from '../../shared/ids/TileId.js';
import type { SolverOptions } from './SolverOptions.js';

export interface RelocationInput {
  readonly tiles: readonly Tile[];
  readonly pinnedTileId: TileId;
  readonly pinnedRect: Rect<Cell>;
  readonly grid: { readonly cols: number; readonly rows: number };
  readonly sizeOf: (tile: Tile) => Size;
  readonly options: SolverOptions;
}
