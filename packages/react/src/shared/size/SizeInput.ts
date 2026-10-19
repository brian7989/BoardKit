import type { Size } from 'boardkit-core';
import type { SizeKey } from './SizeKey.js';

/** A `Size`, or a `"${cols}x${rows}"` shorthand such as `'2x1'` — accepted anywhere a size is. */
export type SizeInput = Size | SizeKey;
