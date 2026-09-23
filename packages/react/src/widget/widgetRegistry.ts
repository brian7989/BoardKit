import type { WidgetManifest } from './WidgetManifest.js';

export function widgetRegistry(widgets: readonly WidgetManifest[]): ReadonlyMap<string, WidgetManifest> {
  return new Map(widgets.map((widget) => [widget.type, widget]));
}
