import type { ResolvedBreakpoint } from './ResolvedBreakpoint.js';

/** The breakpoint an unauthored one starts from: the nearest wider one with a layout, else the nearest narrower one. */
export function nearestAuthored(breakpoints: readonly ResolvedBreakpoint[], target: ResolvedBreakpoint): ResolvedBreakpoint | undefined {
  const index = breakpoints.indexOf(target);
  const wider = breakpoints.slice(0, index).reverse();
  const narrower = breakpoints.slice(index + 1);
  return [...wider, ...narrower].find((breakpoint) => breakpoint.layout !== undefined);
}
