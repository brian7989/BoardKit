import { err, ok, type Result } from '../shared/index.js';
import type { Issue } from '../issues/index.js';
import type { Tile } from '../model/index.js';
import { readArray } from './readers/readArray.js';
import { parseTile } from './parseTile.js';

// Optional: saves from before tiles could be parked simply have none.
export function parseParked(value: unknown, path: string, version: number): Result<readonly Tile[], readonly Issue[]> {
  if (value === undefined) return ok([]);
  const array = readArray(value, path);
  if (!array.ok) return err([array.error]);
  const tiles: Tile[] = [];
  for (const [index, entry] of array.value.entries()) {
    const tile = parseTile(entry, `${path}[${index}]`, version);
    if (!tile.ok) return err(tile.error);
    tiles.push(tile.value);
  }
  return ok(tiles);
}
