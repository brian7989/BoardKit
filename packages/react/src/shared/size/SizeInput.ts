import type { Size } from 'boardkit-core';

/** A `Size`, or a `"${cols}x${rows}"` shorthand such as `'2x1'` — accepted anywhere a size is. */
export type SizeInput = Size | `${number}x${number}`;
