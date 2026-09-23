import { err, ok, type Result } from '../shared/index.js';
import type { Issue } from '../issues/index.js';
import type { LayoutTile } from '../model/index.js';
import { readArray } from './readers/readArray.js';
import { readObject } from './readers/readObject.js';
import { parseLayoutTile } from './parseLayoutTile.js';

type Layouts = Readonly<Record<string, readonly LayoutTile[]>>;

// Absent entirely on a legacy (pre-layouts) state; parsed as an empty map, not an error.
export function parseLayouts(value: unknown, path: string): Result<Layouts, readonly Issue[]> {
  if (value === undefined) return ok({});
  const object = readObject(value, path);
  if (!object.ok) return err([object.error]);

  const layouts: Record<string, readonly LayoutTile[]> = {};
  for (const [key, raw] of Object.entries(object.value)) {
    const tiles = parseLayoutTiles(raw, `${path}.${key}`);
    if (!tiles.ok) return err(tiles.error);
    layouts[key] = tiles.value;
  }
  return ok(layouts);
}

function parseLayoutTiles(value: unknown, path: string): Result<readonly LayoutTile[], readonly Issue[]> {
  const array = readArray(value, path);
  if (!array.ok) return err([array.error]);
  const tiles: LayoutTile[] = [];
  for (const [index, entry] of array.value.entries()) {
    const tile = parseLayoutTile(entry, `${path}[${index}]`);
    if (!tile.ok) return err(tile.error);
    tiles.push(tile.value);
  }
  return ok(tiles);
}
