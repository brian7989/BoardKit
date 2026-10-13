import type { EngineContext } from '../engine/EngineContext.js';
import type { Tile } from '../model/Tile.js';
import type { ReflowChange } from './ReflowChange.js';
import type { ReflowEntry } from './flattenReadingOrder.js';
import type { Page } from './Page.js';

export interface ReflowPlacementInput {
  readonly entry: ReflowEntry;
  readonly ctx: EngineContext;
  readonly pages: Page[];
  readonly changes: ReflowChange[];
  // Tiles with no size that fits this grid land here instead of being deleted.
  readonly parked: Tile[];
}
