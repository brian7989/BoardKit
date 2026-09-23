import type { BoardId } from '../shared/ids/BoardId.js';
import type { TileId } from '../shared/ids/TileId.js';
import type { ReflowChangeKind } from './ReflowChangeKind.js';

export interface ReflowChange {
  // Absent for a page-level change (PageAdded) — there's no tile to name.
  readonly tile?: TileId;
  readonly board: BoardId;
  readonly kind: ReflowChangeKind;
}
