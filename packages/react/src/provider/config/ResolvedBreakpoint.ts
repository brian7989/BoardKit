import type { Engine } from 'boardkit-core';
import type { LayoutEntry } from './LayoutEntry.js';

/** A breakpoint with its own engine already built, ready for the provider to switch onto. */
export interface ResolvedBreakpoint {
  readonly name: string;
  readonly minWidth: number;
  readonly grid: { readonly name: string; readonly cols: number; readonly rows: number; readonly cellAspect: number };
  readonly engine: Engine;
  readonly layout?: readonly LayoutEntry[];
  readonly hide: readonly string[];
}
