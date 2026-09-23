import type { Point } from 'boardkit-core';

/** Where to pin an initial tile: a `[col, row]` tuple or a `{x, y}` point, in plain grid cells. */
export type AtInput = readonly [number, number] | Point<number>;
