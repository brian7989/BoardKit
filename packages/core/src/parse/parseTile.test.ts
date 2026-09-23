import { describe, expect, it } from 'vitest';
import { parseTile } from './parseTile.js';
import { IssueKind } from '../issues/IssueKind.js';
import { tileId } from '../shared/ids/TileId.js';
import { widgetId } from '../shared/ids/WidgetId.js';

const VALID = { id: 't0', col: 1, row: 2, size: { w: 1, h: 1 }, active: 0, items: [{ id: 'w0', type: 'demo.widget' }] };

describe('parseTile', () => {
  it('parses a valid tile, with no float field', () => {
    const result = parseTile(VALID, '$.tile');
    expect(result).toEqual({
      ok: true,
      value: { id: tileId('t0'), col: 1, row: 2, size: { w: 1, h: 1 }, active: 0, items: [{ id: widgetId('w0'), type: 'demo.widget' }] },
    });
  });

  it('carries a valid {x,y} float through', () => {
    const result = parseTile({ ...VALID, float: { x: 1.5, y: 2.5 } }, '$.tile');
    expect(result.ok && result.value.float).toEqual({ x: 1.5, y: 2.5 });
  });

  it.each([
    ['a non-object', 'nope'],
    ['missing y', { x: 1 }],
    ['a non-numeric x', { x: '1', y: 2 }],
  ])('drops a %s float rather than rejecting the tile', (_label, float) => {
    const result = parseTile({ ...VALID, float }, '$.tile');
    expect(result.ok && result.value.float).toBeUndefined();
  });

  it('rejects a non-object value', () => {
    expect(parseTile(null, '$.tile')).toEqual({ ok: false, error: [{ kind: IssueKind.Malformed, path: '$.tile', message: 'Expected an object at $.tile.' }] });
  });

  it('rejects a missing or non-string id', () => {
    const { id, ...rest } = VALID;
    expect(parseTile(rest, '$.tile').ok).toBe(false);
  });

  it('rejects a missing or non-numeric col', () => {
    const { col, ...rest } = VALID;
    expect(parseTile(rest, '$.tile').ok).toBe(false);
  });

  it('rejects a missing or non-numeric row', () => {
    const { row, ...rest } = VALID;
    expect(parseTile(rest, '$.tile').ok).toBe(false);
  });

  it('rejects a malformed size', () => {
    const result = parseTile({ ...VALID, size: 'nope' }, '$.tile');
    expect(result).toEqual({ ok: false, error: [{ kind: IssueKind.Malformed, path: '$.tile.size', message: 'Expected an object at $.tile.size.' }] });
  });

  it('rejects a missing or non-numeric active', () => {
    const { active, ...rest } = VALID;
    expect(parseTile(rest, '$.tile').ok).toBe(false);
  });

  it('rejects a non-array items', () => {
    const result = parseTile({ ...VALID, items: 'nope' }, '$.tile');
    expect(result).toEqual({ ok: false, error: [{ kind: IssueKind.Malformed, path: '$.tile.items', message: 'Expected an array at $.tile.items.' }] });
  });

  it('propagates a malformed item inside items, with its indexed path', () => {
    const result = parseTile({ ...VALID, items: [{ type: 'demo.widget' }] }, '$.tile');
    expect(result).toEqual({
      ok: false,
      error: [{ kind: IssueKind.Malformed, path: '$.tile.items[0].id', message: 'Expected a string at $.tile.items[0].id.' }],
    });
  });
});
