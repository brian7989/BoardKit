import { TileHeaderPlacement } from './TileHeaderPlacement.js';

/** Null when no tileHeader is configured; otherwise strip for a normal widget, overlay for `header: false`. */
export function tileHeaderPlacementFor(tileHeaderProvided: boolean, manifestHeader: boolean | undefined): TileHeaderPlacement | null {
  if (!tileHeaderProvided) return null;
  return manifestHeader === false ? TileHeaderPlacement.Overlay : TileHeaderPlacement.Strip;
}
