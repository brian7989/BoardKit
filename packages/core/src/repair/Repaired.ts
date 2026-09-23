import type { BoardsState } from '../model/index.js';
import type { TileId } from '../shared/ids/TileId.js';

export interface Repaired {
  readonly state: BoardsState;
  readonly relocated: readonly TileId[];
  readonly dropped: readonly TileId[];
}
