import { isFloating, isFree, type Tile } from './Tile.js';
import { TileLayer } from './TileLayer.js';

// Grid tiles collide with each other; snapped Overlay tiles collide only with each other;
// Free tiles collide with nothing.
export function layerOf(tile: Tile): TileLayer {
  if (!isFloating(tile)) return TileLayer.Grid;
  return isFree(tile) ? TileLayer.Free : TileLayer.Overlay;
}
