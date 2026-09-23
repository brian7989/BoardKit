import type { WidgetManifest } from '../../widget/index.js';
import { warnOnce } from '../../shared/dev/warnOnce.js';
import { readCandidateWidgetTypes } from './readCandidateWidgetTypes.js';

/** Dev-only: warns once per type about a loaded tile whose widget type isn't registered (it will be dropped by repair). */
export function warnUnregisteredLoadedWidgets(raw: unknown, widgets: ReadonlyMap<string, WidgetManifest>): void {
  const types = new Set(readCandidateWidgetTypes(raw));
  for (const type of types) {
    if (widgets.has(type)) continue;
    warnOnce(`unregistered-widget:${type}`, `Boards: loaded data has a tile using widget type "${type}", which isn't registered; it will be dropped.`);
  }
}
