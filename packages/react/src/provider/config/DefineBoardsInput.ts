import type { EngineConfig } from 'boardkit-core';
import type { AnyWidget } from '../../widget/index.js';
import type { BreakpointInput } from './BreakpointInput.js';
import type { GridInput } from './GridInput.js';
import type { LayoutEntry } from './LayoutEntry.js';

/** Input to `defineBoards`: the widgets, and either one `grid` (with its `layout`) or named `breakpoints`. */
export interface DefineBoardsInput<W extends readonly AnyWidget[] = readonly AnyWidget[]> {
  readonly widgets: W;
  /** One grid for every screen size. */
  readonly grid?: GridInput;
  /** A cell's width ÷ height, for `grid`: 1 (the default) is square, 2 is twice as wide as tall. */
  readonly cellAspect?: number;
  /** What `grid` starts with. */
  readonly layout?: readonly LayoutEntry<W[number]>[];
  /** A grid per breakpoint, by name. `<Board>` measures its own width and switches between them. */
  readonly breakpoints?: { readonly [name: string]: BreakpointInput<W[number]> };
  readonly solver?: EngineConfig['solver'];
  readonly createId?: () => string;
  /** Design px per cell: the fixed canvas every widget renders at, scaled to fit its real cell. */
  readonly designCellSize?: number;
}
