import type { Engine } from 'boardkit-core';

// A GridBreakpoint with its own engine built, ready for the provider to switch onto.
/** A `GridBreakpoint` with its own engine already built, ready for the provider to switch onto. */
export interface ResolvedBreakpoint {
  readonly minWidth: number;
  readonly grid: { readonly cols: number; readonly rows: number; readonly cellAspect: number };
  readonly engine: Engine;
}
