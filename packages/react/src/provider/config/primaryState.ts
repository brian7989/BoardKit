import { hideTiles, type BoardsState } from 'boardkit-core';
import type { BoardsConfig } from './BoardsConfig.js';
import type { ResolvedBreakpoint } from './ResolvedBreakpoint.js';
import { addMissingTiles } from './addMissingTiles.js';
import { allTiles } from './allTiles.js';
import { buildLayout } from './buildLayout.js';
import { hiddenTileIds } from './hiddenTileIds.js';
import { layoutWidgetIds } from './layoutWidgetIds.js';
import { onBreakpoint } from './onBreakpoint.js';
import { warnUnlisted } from './warnUnlisted.js';

/** The widest authored breakpoint's layout, plus every widget the other layouts list that it doesn't, so all breakpoints share one set of widgets. */
export function primaryState(config: BoardsConfig, primary: ResolvedBreakpoint, others: readonly ResolvedBreakpoint[]): BoardsState {
  const on = onBreakpoint(config, primary);
  const entries = primary.layout ?? [];
  let state = buildLayout(on, entries);
  for (const other of others) state = addMissingTiles({ config: on, state, from: onBreakpoint(config, other), entries: other.layout ?? [] });
  state = hideTiles(state, hiddenTileIds(allTiles(state), primary.hide, primary.name));
  warnUnlisted(state, layoutWidgetIds(on, entries), primary.name);
  return state;
}
