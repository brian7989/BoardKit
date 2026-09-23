import type { BoardId } from '../shared/ids/BoardId.js';
import type { Tile } from './Tile.js';

export interface Board {
  readonly id: BoardId;
  readonly tiles: readonly Tile[];
}
