import type { BoardsState } from 'boardkit-core';
import type { BoardsConfig } from './BoardsConfig.js';
import { nearestAuthored } from './nearestAuthored.js';
import { pickBreakpoint } from './pickBreakpoint.js';
import { primaryState } from './primaryState.js';
import { withAuthoredLayout } from './withAuthoredLayout.js';
import { withDerivedLayout } from './withDerivedLayout.js';

/** Options for `createInitialState`. */
export interface CreateInitialStateOptions {
  /** The board's width in px, picking which breakpoint the state starts on. Defaults to the widest. */
  readonly width?: number;
}

// Every breakpoint gets its layout up front, authored or derived, so each one always starts the same.
function initialState(config: BoardsConfig): BoardsState {
  const authored = config.breakpoints.filter((breakpoint) => breakpoint.layout !== undefined);
  const [primary, ...others] = authored;
  if (!primary) return config.engine.empty();
  let base = primaryState(config, primary, others);
  for (const breakpoint of others) base = withAuthoredLayout({ config, base, primary }, breakpoint);
  for (const target of config.breakpoints) {
    const source = target.layout ? undefined : nearestAuthored(config.breakpoints, target);
    if (source) base = withDerivedLayout({ base, source, target });
  }
  return base;
}

/** Builds the state an uncontrolled `BoardProvider` starts from, with every breakpoint's layout. */
export function createInitialState(config: BoardsConfig, options: CreateInitialStateOptions = {}): BoardsState {
  const target = options.width === undefined ? config.breakpoints[0] : pickBreakpoint(config.breakpoints, options.width);
  const state = initialState(config);
  return target ? target.engine.reflow(state).state : state;
}
