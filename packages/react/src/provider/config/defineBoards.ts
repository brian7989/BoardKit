import { widgetRegistry, type AnyWidget } from '../../widget/index.js';
import { createDefaultId } from './createDefaultId.js';
import { resolveBreakpoints } from './resolveBreakpoints.js';
import { warnDuplicateWidgetTypes } from './warnDuplicateWidgetTypes.js';
import { warnUnfittableSizes } from './warnUnfittableSizes.js';
import { checkLayouts } from './checkLayouts.js';
import type { BoardsConfig } from './BoardsConfig.js';
import type { DefineBoardsInput } from './DefineBoardsInput.js';

const DEFAULT_DESIGN_CELL_SIZE = 160;

/** Builds the engine(s) and config a BoardProvider needs from the widgets and a grid, or named breakpoints. */
export function defineBoards<const W extends readonly AnyWidget[]>(input: DefineBoardsInput<W>): BoardsConfig {
  const breakpoints = resolveBreakpoints(input);
  const widest = breakpoints[0];
  if (!widest) throw new Error('defineBoards requires at least one breakpoint.');
  warnDuplicateWidgetTypes(input.widgets);
  warnUnfittableSizes(input.widgets, breakpoints);
  const config: BoardsConfig = {
    breakpoints,
    engine: widest.engine,
    grid: widest.grid,
    widgets: widgetRegistry(input.widgets),
    createId: input.createId ?? createDefaultId,
    designCellSize: input.designCellSize ?? DEFAULT_DESIGN_CELL_SIZE,
  };
  checkLayouts(config);
  return config;
}
