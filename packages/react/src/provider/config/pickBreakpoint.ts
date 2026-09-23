import type { ResolvedBreakpoint } from './ResolvedBreakpoint.js';

function widest(a: ResolvedBreakpoint, b: ResolvedBreakpoint): ResolvedBreakpoint {
  return b.minWidth > a.minWidth ? b : a;
}

function narrowest(a: ResolvedBreakpoint, b: ResolvedBreakpoint): ResolvedBreakpoint {
  return b.minWidth < a.minWidth ? b : a;
}

// The tightest-fitting breakpoint at or below the width, or the least demanding one if none
// qualify. Requires at least one breakpoint, which defineBoards always resolves.
export function pickBreakpoint(breakpoints: readonly ResolvedBreakpoint[], width: number): ResolvedBreakpoint {
  const eligible = breakpoints.filter((bp) => width >= bp.minWidth);
  return eligible.length > 0 ? eligible.reduce(widest) : breakpoints.reduce(narrowest);
}
