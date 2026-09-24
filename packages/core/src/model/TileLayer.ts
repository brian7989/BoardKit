import type { ValueOf } from '../shared/unions/ValueOf.js';

/** The three collision groups a tile belongs to; see `layerOf`. */
export const TileLayer = {
  Grid: 'grid',
  Overlay: 'overlay',
  Free: 'free',
} as const;

export type TileLayer = ValueOf<typeof TileLayer>;
