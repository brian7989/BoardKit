import type { WidgetInstance } from 'boardkit-core';
import type { WidgetManifest } from './WidgetManifest.js';

/** Instance's own name, else its manifest title, else its raw type. */
export function displayNameOf(item: WidgetInstance, manifest: WidgetManifest | undefined): string {
  return item.displayName?.trim() || manifest?.title || item.type;
}
