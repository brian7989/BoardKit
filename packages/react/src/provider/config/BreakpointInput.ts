import type { AnyWidget } from '../../widget/index.js';
import type { GridInput } from './GridInput.js';
import type { LayoutEntry } from './LayoutEntry.js';

/** One named breakpoint: the grid the board uses once it is at least `minWidth` px wide. */
export interface BreakpointInput<W extends AnyWidget = AnyWidget> {
  readonly minWidth: number;
  readonly grid: GridInput;
  /** A cell's width ÷ height: 1 (the default) is square, 2 is twice as wide as tall. */
  readonly cellAspect?: number;
  /** What this breakpoint starts with. Without one, it starts from the nearest wider breakpoint's layout. */
  readonly layout?: readonly LayoutEntry<W>[];
  /** Widgets left off this breakpoint: kept, and shown again on any breakpoint that doesn't hide them. */
  readonly hide?: readonly W['type'][];
}
