import type { WidgetManifest } from '../../widget/index.js';
import type { ResolvedBreakpoint } from './ResolvedBreakpoint.js';
import { warnOnce } from '../../shared/dev/warnOnce.js';

function fitsGrid(widget: WidgetManifest, grid: ResolvedBreakpoint['grid']): boolean {
  return widget.sizes.some((size) => size.w <= grid.cols && size.h <= grid.rows);
}

function warnForBreakpoint(widgets: readonly WidgetManifest[], breakpoint: ResolvedBreakpoint): void {
  for (const widget of widgets) {
    if (fitsGrid(widget, breakpoint.grid)) continue;
    const grid = `${breakpoint.grid.cols}x${breakpoint.grid.rows}`;
    warnOnce(`unfittable-size:${widget.type}:${grid}`, `Boards: widget "${widget.type}" has no size that fits the ${grid} grid.`);
  }
}

/** Dev-only: warns once per config about a widget whose sizes can't fit some breakpoint's grid. */
export function warnUnfittableSizes(widgets: readonly WidgetManifest[], breakpoints: readonly ResolvedBreakpoint[]): void {
  for (const breakpoint of breakpoints) warnForBreakpoint(widgets, breakpoint);
}
