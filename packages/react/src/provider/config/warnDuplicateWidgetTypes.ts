import type { WidgetManifest } from '../../widget/index.js';
import { warnOnce } from '../../shared/dev/warnOnce.js';

function duplicateTypes(widgets: readonly WidgetManifest[]): readonly string[] {
  const counts = new Map<string, number>();
  for (const widget of widgets) counts.set(widget.type, (counts.get(widget.type) ?? 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([type]) => type);
}

/** Dev-only: warns once per config about widget types registered more than once. */
export function warnDuplicateWidgetTypes(widgets: readonly WidgetManifest[]): void {
  for (const type of duplicateTypes(widgets)) {
    warnOnce(`duplicate-widget:${type}`, `Boards: widget type "${type}" is registered more than once; only the last one wins.`);
  }
}
