import type { EngineContext } from '../engine/EngineContext.js';
import type { ReflowChange } from './ReflowChange.js';
import type { ReflowEntry } from './flattenReadingOrder.js';
import type { Page } from './Page.js';

export interface ReflowPlacementInput {
  readonly entry: ReflowEntry;
  readonly ctx: EngineContext;
  readonly pages: Page[];
  readonly changes: ReflowChange[];
}
