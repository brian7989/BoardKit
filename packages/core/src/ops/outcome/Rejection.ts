import type { TileId } from '../../shared/ids/TileId.js';
import type { RejectReason } from './RejectReason.js';

/** The engine's answer when an `Op` cannot apply: why, and which tiles were in the way. */
export interface Rejection {
  readonly reason: RejectReason;
  readonly blockedBy?: readonly TileId[];
}
