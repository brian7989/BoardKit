import type { Engine } from 'boardkit-core';
import type { WidgetManifest } from '../../widget/index.js';
import type { InitialLayoutTile } from './InitialLayoutTile.js';
import type { ResolvedBreakpoint } from './ResolvedBreakpoint.js';

/** Everything `defineBoards` resolves for `BoardProvider`: engines, widgets, and seed/id settings. */
export interface BoardsConfig {
  // Widest first; there is always at least one. `<Board>`'s measured width picks which is active.
  readonly breakpoints: readonly ResolvedBreakpoint[];
  // The widest breakpoint's own engine and grid — a convenience for building fixture state
  // outside a provider (tests, seed data) when the app defines only one grid.
  readonly engine: Engine;
  readonly grid: ResolvedBreakpoint['grid'];
  readonly widgets: ReadonlyMap<string, WidgetManifest>;
  readonly createId: () => string;
  /** A widget's fixed design canvas, in design px per cell — see `defineBoards`'s `designCellSize`. */
  readonly designCellSize: number;
  /** The tileHeader strip's fixed height, in design px — see `defineBoards`'s `headerHeight`. */
  readonly headerHeight: number;
  /** The widgets an uncontrolled `BoardProvider` seeds itself with — see `defineBoards`'s `initialLayout`. */
  readonly initialLayout?: readonly InitialLayoutTile[];
}
