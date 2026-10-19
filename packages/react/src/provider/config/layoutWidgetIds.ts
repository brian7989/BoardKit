import type { BoardsConfig } from './BoardsConfig.js';
import type { LayoutEntry } from './LayoutEntry.js';
import { resolveEntries } from './resolveEntries.js';

/** The widget ids a layout lists, stacked ones included, as its entries resolve them. */
export function layoutWidgetIds(config: BoardsConfig, entries: readonly LayoutEntry[]): ReadonlySet<string> {
  const resolved = resolveEntries({ config, counts: new Map() }, entries);
  return new Set(resolved.flatMap((item) => [item.resolved.widget.id, ...item.resolved.stack.map((widget) => widget.id)]));
}
