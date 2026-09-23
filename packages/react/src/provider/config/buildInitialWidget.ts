import { widgetId, type WidgetInstance } from 'boardkit-core';
import type { WidgetManifest } from '../../widget/index.js';
import type { InitialLayoutTile } from './InitialLayoutTile.js';

/** Builds the `WidgetInstance` for one initial-layout entry, given its already-picked id. */
export function buildInitialWidget(entry: InitialLayoutTile, manifest: WidgetManifest, id: string): WidgetInstance {
  const props = { ...manifest.defaultProps, ...entry.props };
  const hasProps = Object.keys(props).length > 0;
  return {
    id: widgetId(id),
    type: entry.widget,
    ...(hasProps ? { props } : {}),
    ...(entry.name ? { displayName: entry.name } : {}),
  };
}
