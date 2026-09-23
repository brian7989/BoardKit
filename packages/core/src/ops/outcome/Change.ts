import type { Rect } from '../../shared/geometry/Rect.js';
import type { Cell } from '../../shared/units/Cell.js';
import type { BoardId } from '../../shared/ids/BoardId.js';
import type { TileId } from '../../shared/ids/TileId.js';
import type { ChangeKind } from './ChangeKind.js';

export interface Change {
  // Absent for a board-level change (BoardAdded/BoardRemoved) — there's no tile to name.
  readonly tile?: TileId;
  readonly board: BoardId;
  readonly kind: ChangeKind;
  readonly from?: Rect<Cell>;
  readonly to?: Rect<Cell>;
}
