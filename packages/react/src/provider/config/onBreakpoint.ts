import type { BoardsConfig } from './BoardsConfig.js';
import type { ResolvedBreakpoint } from './ResolvedBreakpoint.js';

/** `config`, retargeted at one breakpoint's engine and grid, for building that breakpoint's layout. */
export function onBreakpoint(config: BoardsConfig, breakpoint: ResolvedBreakpoint): BoardsConfig {
  return { ...config, engine: breakpoint.engine, grid: breakpoint.grid };
}
