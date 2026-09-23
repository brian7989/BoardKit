import { err, ok, cell, tileId, type Result, type Size } from '../shared/index.js';
import type { Issue } from '../issues/index.js';
import type { Tile, WidgetInstance } from '../model/index.js';
import { readArray } from './readers/readArray.js';
import { readNumber } from './readers/readNumber.js';
import { readObject } from './readers/readObject.js';
import { readString } from './readers/readString.js';
import { parseSize } from './parseSize.js';
import { parseWidgetInstance } from './parseWidgetInstance.js';
import { parseFloatPosition } from './parseFloatPosition.js';

export function parseTile(value: unknown, path: string): Result<Tile, readonly Issue[]> {
  const object = readObject(value, path);
  if (!object.ok) return err([object.error]);
  const v = object.value;

  const id = readString(v['id'], `${path}.id`);
  if (!id.ok) return err([id.error]);
  const col = readNumber(v['col'], `${path}.col`);
  if (!col.ok) return err([col.error]);
  const row = readNumber(v['row'], `${path}.row`);
  if (!row.ok) return err([row.error]);
  const size = parseSize(v['size'], `${path}.size`);
  if (!size.ok) return err(size.error);
  const active = readNumber(v['active'], `${path}.active`);
  if (!active.ok) return err([active.error]);
  const items = parseItems(v['items'], `${path}.items`);
  if (!items.ok) return err(items.error);

  return ok(buildTile({ id: id.value, col: col.value, row: row.value, size: size.value, active: active.value, items: items.value, float: v['float'] }));
}

interface TileFields {
  readonly id: string;
  readonly col: number;
  readonly row: number;
  readonly size: Size;
  readonly active: number;
  readonly items: readonly WidgetInstance[];
  readonly float: unknown;
}

function buildTile(fields: TileFields): Tile {
  return {
    id: tileId(fields.id),
    col: cell(fields.col),
    row: cell(fields.row),
    size: fields.size,
    items: fields.items,
    active: fields.active,
    ...parseFloatPosition(fields.float),
  };
}

function parseItems(value: unknown, path: string): Result<readonly WidgetInstance[], readonly Issue[]> {
  const array = readArray(value, path);
  if (!array.ok) return err([array.error]);
  const items: WidgetInstance[] = [];
  for (const [index, entry] of array.value.entries()) {
    const item = parseWidgetInstance(entry, `${path}[${index}]`);
    if (!item.ok) return err(item.error);
    items.push(item.value);
  }
  return ok(items);
}
