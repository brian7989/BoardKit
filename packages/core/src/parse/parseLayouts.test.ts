import { describe, expect, it } from 'vitest';
import { parseLayouts } from './parseLayouts.js';
import { IssueKind } from '../issues/IssueKind.js';
import { boardId, cell, tileId } from '../shared/index.js';

const ENTRY = { tile: 't0', board: 'default', col: 0, row: 0, size: { w: 1, h: 1 } };

describe('parseLayouts', () => {
  it('parses an empty map when the field is absent (a legacy, pre-layouts state)', () => {
    expect(parseLayouts(undefined, '$.layouts')).toEqual({ ok: true, value: {} });
  });

  it('parses a map of breakpoint keys to their saved tiles', () => {
    const result = parseLayouts({ '6x4': [ENTRY] }, '$.layouts');
    expect(result).toEqual({
      ok: true,
      value: { '6x4': [{ tile: tileId('t0'), board: boardId('default'), col: cell(0), row: cell(0), size: { w: 1, h: 1 } }] },
    });
  });

  it('rejects a non-object value', () => {
    expect(parseLayouts('nope', '$.layouts')).toEqual({
      ok: false,
      error: [{ kind: IssueKind.Malformed, path: '$.layouts', message: 'Expected an object at $.layouts.' }],
    });
  });

  it('rejects a non-array entry', () => {
    expect(parseLayouts({ '6x4': 'nope' }, '$.layouts').ok).toBe(false);
  });

  it('propagates a malformed layout tile inside an entry, with its indexed path', () => {
    const result = parseLayouts({ '6x4': [{ ...ENTRY, tile: undefined }] }, '$.layouts');
    expect(result).toEqual({
      ok: false,
      error: [{ kind: IssueKind.Malformed, path: '$.layouts.6x4[0].tile', message: 'Expected a string at $.layouts.6x4[0].tile.' }],
    });
  });
});
