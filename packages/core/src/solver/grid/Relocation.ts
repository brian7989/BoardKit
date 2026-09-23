import type { Rect } from '../../shared/geometry/Rect.js';
import type { Cell } from '../../shared/units/Cell.js';
import type { TileId } from '../../shared/ids/TileId.js';
import type { Result } from '../../shared/result/Result.js';

// Success: rects for all displaced tiles. Failure: tiles that couldn't move (blockedBy).
export type Relocation = Result<ReadonlyMap<TileId, Rect<Cell>>, { readonly blockedBy: readonly TileId[] }>;
