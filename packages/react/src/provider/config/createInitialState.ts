import { withSavedLayout, type BoardsState } from 'boardkit-core';
import type { BoardsConfig } from './BoardsConfig.js';
import type { ResolvedBreakpoint } from './ResolvedBreakpoint.js';
import { addMissingTiles } from './addMissingTiles.js';
import { buildLayout } from './buildLayout.js';
import { pickBreakpoint } from './pickBreakpoint.js';

/** Options for `createInitialState`. */
export interface CreateInitialStateOptions {
  /** The board's width in px, picking which breakpoint the state starts on. Defaults to the widest. */
  readonly width?: number;
}

function onBreakpoint(config: BoardsConfig, breakpoint: ResolvedBreakpoint): BoardsConfig {
  return { ...config, engine: breakpoint.engine, grid: breakpoint.grid };
}

// Every other authored layout is stored as that breakpoint's remembered layout, so switching onto
// it restores it exactly; its widgets the base layout lacks are added to the base first.
function withAuthoredLayouts(config: BoardsConfig, base: BoardsState): BoardsState {
  let state = base;
  for (const breakpoint of config.breakpoints.slice(1)) {
    if (!breakpoint.initialLayout) continue;
    const from = onBreakpoint(config, breakpoint);
    state = addMissingTiles({ config, state, from, entries: breakpoint.initialLayout });
    state = withSavedLayout(state, buildLayout(from, breakpoint.initialLayout));
  }
  return state;
}

/**
 * Builds the state an uncontrolled `BoardProvider` starts from: the widest breakpoint's own
 * `initialLayout` (else the top-level one), plus every other breakpoint's authored layout.
 */
export function createInitialState(config: BoardsConfig, options: CreateInitialStateOptions = {}): BoardsState {
  const widest = config.breakpoints[0];
  const base = buildLayout(config, widest?.initialLayout ?? config.initialLayout ?? []);
  const state = withAuthoredLayouts(config, base);
  if (options.width === undefined) return state;
  return pickBreakpoint(config.breakpoints, options.width).engine.reflow(state).state;
}
