import type { Engine } from 'boardkit-core';
import type { InitialLayoutTile } from './InitialLayoutTile.js';

/** A `GridBreakpoint` with its own engine already built, ready for the provider to switch onto. */
export interface ResolvedBreakpoint {
  readonly minWidth: number;
  readonly grid: { readonly cols: number; readonly rows: number; readonly cellAspect: number };
  readonly engine: Engine;
  readonly initialLayout?: readonly InitialLayoutTile[];
}
