import { hideTiles, withSavedLayout, type BoardsState } from 'boardkit-core';
import type { BoardsConfig } from './BoardsConfig.js';
import type { ResolvedBreakpoint } from './ResolvedBreakpoint.js';
import { buildLayout } from './buildLayout.js';
import { hiddenTileIds } from './hiddenTileIds.js';
import { layoutWidgetIds } from './layoutWidgetIds.js';
import { onBreakpoint } from './onBreakpoint.js';
import { warnUnlisted } from './warnUnlisted.js';
import { allTiles } from './allTiles.js';

export interface AuthoredLayoutInput {
  readonly config: BoardsConfig;
  readonly base: BoardsState;
}

/** Stores another authored breakpoint's layout, stacks included, on `base`, with the widgets it doesn't list placed first-fit (or hidden). */
export function withAuthoredLayout(input: AuthoredLayoutInput, breakpoint: ResolvedBreakpoint): BoardsState {
  const { config, base } = input;
  const on = onBreakpoint(config, breakpoint);
  const entries = breakpoint.layout ?? [];
  const own = buildLayout(on, entries);
  const placed = breakpoint.engine.reflow(withSavedLayout(base, own)).state;
  const shown = hideTiles(placed, hiddenTileIds(allTiles(placed), breakpoint.hide, breakpoint.name));
  warnUnlisted(shown, layoutWidgetIds(on, entries), breakpoint.name);
  return withSavedLayout(base, shown);
}
