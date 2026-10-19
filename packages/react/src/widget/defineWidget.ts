import { parseSizeInput } from '../shared/size/parseSizeInput.js';
import type { SizeInput } from '../shared/size/SizeInput.js';
import type { SizeKeysOf, WidgetManifest, WidgetManifestInput } from './WidgetManifest.js';

/**
 * Defines a widget's manifest. Its props, type name and sizes are all inferred, so layouts can be
 * checked against them; passing `<Props>` explicitly works too, but layouts then accept any name and size.
 */
export function defineWidget<P extends object, const T extends string = string, const S extends SizeInput = SizeInput>(manifest: WidgetManifestInput<P, T, S>): WidgetManifest<P, T, SizeKeysOf<S>> {
  return { ...manifest, sizes: manifest.sizes.map(parseSizeInput) } as unknown as WidgetManifest<P, T, SizeKeysOf<S>>;
}
