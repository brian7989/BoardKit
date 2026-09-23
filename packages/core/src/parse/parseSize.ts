import { err, ok, cell, type Result, type Size } from '../shared/index.js';
import type { Issue } from '../issues/index.js';
import { readNumber } from './readers/readNumber.js';
import { readObject } from './readers/readObject.js';

export function parseSize(value: unknown, path: string): Result<Size, readonly Issue[]> {
  const object = readObject(value, path);
  if (!object.ok) return err([object.error]);

  const w = readNumber(object.value['w'], `${path}.w`);
  if (!w.ok) return err([w.error]);
  const h = readNumber(object.value['h'], `${path}.h`);
  if (!h.ok) return err([h.error]);

  return ok({ w: cell(w.value), h: cell(h.value) });
}
