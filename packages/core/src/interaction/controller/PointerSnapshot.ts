import type { TileId } from '../../shared/ids/TileId.js';
import type { FractionalCell } from '../hitTest/pxToFractionalCell.js';

// Separate to avoid re-renders of other tiles on every pointer move.
export type PointerSnapshot = { readonly tile: TileId; readonly origin: FractionalCell } | null;
