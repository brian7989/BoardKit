import { parseSizeInput } from '../shared/size/parseSizeInput.js';
import type { WidgetManifest, WidgetManifestInput } from './WidgetManifest.js';

/** Defines a widget's manifest; `P` is inferred from `component`/`defaultProps`, no generic needed. */
export function defineWidget<P extends object>(manifest: WidgetManifestInput<P>): WidgetManifest {
  return { ...manifest, sizes: manifest.sizes.map(parseSizeInput) } as unknown as WidgetManifest;
}
