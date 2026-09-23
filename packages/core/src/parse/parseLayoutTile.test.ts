import { describe, expect, it } from 'vitest';
import { parseLayoutTile } from './parseLayoutTile.js';
import { IssueKind } from '../issues/IssueKind.js';
import { boardId, cell, tileId } from '../shared/index.js';

const VALID = { tile: 't0', board: 'default', col: 1, row: 2, size: { w: 2, h: 1 } };

describe('parseLayoutTile', () => {
  it('parses a valid entry', () => {
    const result = parseLayoutTile(VALID, '$');
    expect(result).toEqual({ ok: true, value: { tile: tileId('t0'), board: boardId('default'), col: cell(1), row: cell(2), size: { w: 2, h: 1 } } });
  });

  it('parses a floating entry', () => {
    const result = parseLayoutTile({ ...VALID, float: { x: 0.5, y: 1 } }, '$');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.float).toEqual({ x: 0.5, y: 1 });
  });

  it('rejects a non-object value', () => {
    expect(parseLayoutTile('nope', '$')).toEqual({ ok: false, error: [{ kind: IssueKind.Malformed, path: '$', message: 'Expected an object at $.' }] });
  });

  it('rejects a missing tile id', () => {
    const { tile: _tile, ...rest } = VALID;
    expect(parseLayoutTile(rest, '$').ok).toBe(false);
  });

  it('rejects a missing board id', () => {
    const { board: _board, ...rest } = VALID;
    expect(parseLayoutTile(rest, '$').ok).toBe(false);
  });

  it('rejects a missing or malformed col, row, or size', () => {
    expect(parseLayoutTile({ ...VALID, col: 'x' }, '$').ok).toBe(false);
    expect(parseLayoutTile({ ...VALID, row: 'x' }, '$').ok).toBe(false);
    expect(parseLayoutTile({ ...VALID, size: 'x' }, '$').ok).toBe(false);
  });
});
