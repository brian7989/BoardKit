import type { BoardId } from '../shared/ids/BoardId.js';
import type { Tile } from '../model/Tile.js';

// A page being rebuilt during reflow. `isNew` marks one opened for overflow, as opposed to
// one that already existed on the incoming state (kept even if it ends up empty).
export interface Page {
  readonly id: BoardId;
  readonly tiles: Tile[];
  readonly isNew: boolean;
}
