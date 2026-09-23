import type { Rect } from '../../../shared/geometry/Rect.js';
import type { Cell } from '../../../shared/units/Cell.js';
import type { TileId } from '../../../shared/ids/TileId.js';
import type { RelocationBoard } from './RelocationBoard.js';

// One node's scalar bookkeeping plus a reference to the shared board — cheap to create since
// nothing here is copied. `placed` is set only once a state is snapshotted as the best.
export interface RelocationState {
  readonly board: RelocationBoard;
  readonly remaining: number;
  readonly tilesMoved: number;
  readonly totalDistance: number;
  readonly directionPenalty: number;
  readonly placed?: ReadonlyMap<TileId, Rect<Cell>>;
}
