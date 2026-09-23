import type { Size } from 'boardkit-core';
import type { WidgetManifest } from './WidgetManifest.js';

/** The widget-type-to-sizes shape createEngine needs, derived from the host's manifests. */
export function catalogOf(widgets: readonly WidgetManifest[]): Readonly<Record<string, { readonly sizes: readonly Size[] }>> {
  return Object.fromEntries(widgets.map((widget) => [widget.type, { sizes: widget.sizes }]));
}
