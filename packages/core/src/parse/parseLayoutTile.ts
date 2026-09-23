import { err, ok, boardId, cell, tileId, type Cell, type Result, type Size } from '../shared/index.js';
import type { Issue } from '../issues/index.js';
import type { LayoutTile } from '../model/index.js';
import { readNumber } from './readers/readNumber.js';
import { readObject } from './readers/readObject.js';
import { readString } from './readers/readString.js';
import { parseSize } from './parseSize.js';
import { parseFloatPosition } from './parseFloatPosition.js';

export function parseLayoutTile(value: unknown, path: string): Result<LayoutTile, readonly Issue[]> {
  const object = readObject(value, path);
  if (!object.ok) return err([object.error]);
  const v = object.value;

  const tile = readString(v['tile'], `${path}.tile`);
  if (!tile.ok) return err([tile.error]);
  const board = readString(v['board'], `${path}.board`);
  if (!board.ok) return err([board.error]);
  const position = parsePosition(v, path);
  if (!position.ok) return err(position.error);

  return ok({ tile: tileId(tile.value), board: boardId(board.value), ...position.value, ...parseFloatPosition(v['float']) });
}

interface Position {
  readonly col: Cell;
  readonly row: Cell;
  readonly size: Size;
}

function parsePosition(v: Record<string, unknown>, path: string): Result<Position, readonly Issue[]> {
  const col = readNumber(v['col'], `${path}.col`);
  if (!col.ok) return err([col.error]);
  const row = readNumber(v['row'], `${path}.row`);
  if (!row.ok) return err([row.error]);
  const size = parseSize(v['size'], `${path}.size`);
  if (!size.ok) return err(size.error);
  return ok({ col: cell(col.value), row: cell(row.value), size: size.value });
}
