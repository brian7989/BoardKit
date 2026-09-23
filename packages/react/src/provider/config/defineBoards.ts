import type { EngineConfig } from 'boardkit-core';
import { widgetRegistry, type WidgetManifest } from '../../widget/index.js';
import { createDefaultId } from './createDefaultId.js';
import { resolveBreakpoints, type SingleGrid } from './resolveBreakpoints.js';
import { warnDuplicateWidgetTypes } from './warnDuplicateWidgetTypes.js';
import { warnUnfittableSizes } from './warnUnfittableSizes.js';
import type { GridBreakpoint } from './GridBreakpoint.js';
import type { BoardsConfig } from './BoardsConfig.js';
import type { InitialLayoutTile } from './InitialLayoutTile.js';

/** Input to `defineBoards`: the grid(s), widget catalog, and optional seed/solver settings. */
export interface DefineBoardsInput {
  // Either one grid, or a set of breakpoints — `<Board>` measures its container and reflows
  // onto whichever one currently applies.
  readonly grid: SingleGrid | readonly GridBreakpoint[];
  readonly widgets: readonly WidgetManifest[];
  readonly solver?: EngineConfig['solver'];
  readonly createId?: () => string;
  /** Design px per cell: the fixed canvas every widget renders at, scaled to fit its real cell. */
  readonly designCellSize?: number;
  /** Design px height of the tileHeader strip, when a tileHeader is provided (default 32). */
  readonly headerHeight?: number;
  /** What an uncontrolled `BoardProvider` (no `value`/`defaultValue`, no saved `storageKey` data) starts with. */
  readonly initialLayout?: readonly InitialLayoutTile[];
}

const DEFAULT_DESIGN_CELL_SIZE = 160;
const DEFAULT_HEADER_HEIGHT = 32;

/** Builds the engine(s) and config a BoardProvider needs from a grid and widget catalog. */
export function defineBoards(input: DefineBoardsInput): BoardsConfig {
  const breakpoints = resolveBreakpoints({ grid: input.grid, widgets: input.widgets, ...(input.solver ? { solver: input.solver } : {}) });
  const widest = breakpoints[0];
  if (!widest) throw new Error('defineBoards requires at least one grid breakpoint.');
  warnDuplicateWidgetTypes(input.widgets);
  warnUnfittableSizes(input.widgets, breakpoints);
  return {
    breakpoints,
    engine: widest.engine,
    grid: widest.grid,
    widgets: widgetRegistry(input.widgets),
    createId: input.createId ?? createDefaultId,
    designCellSize: input.designCellSize ?? DEFAULT_DESIGN_CELL_SIZE,
    headerHeight: input.headerHeight ?? DEFAULT_HEADER_HEIGHT,
    ...(input.initialLayout ? { initialLayout: input.initialLayout } : {}),
  };
}
