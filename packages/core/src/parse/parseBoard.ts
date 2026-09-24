import { err, ok, boardId, type Result } from '../shared/index.js';
import type { Issue } from '../issues/index.js';
import { STATE_VERSION, type Board, type Tile } from '../model/index.js';
import { readArray } from './readers/readArray.js';
import { readObject } from './readers/readObject.js';
import { readString } from './readers/readString.js';
import { parseTile } from './parseTile.js';

export function parseBoard(value: unknown, path: string, version: number = STATE_VERSION): Result<Board, readonly Issue[]> {
  const object = readObject(value, path);
  if (!object.ok) return err([object.error]);

  const id = readString(object.value['id'], `${path}.id`);
  if (!id.ok) return err([id.error]);
  const tiles = parseTiles(object.value['tiles'], `${path}.tiles`, version);
  if (!tiles.ok) return err(tiles.error);

  return ok({ id: boardId(id.value), tiles: tiles.value });
}

function parseTiles(value: unknown, path: string, version: number): Result<readonly Tile[], readonly Issue[]> {
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
