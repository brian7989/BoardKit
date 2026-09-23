import { describe, expect, it } from 'vitest';
import { parseBoard } from './parseBoard.js';
import { IssueKind } from '../issues/IssueKind.js';
import { boardId } from '../shared/ids/BoardId.js';

const VALID_TILE = { id: 't0', col: 0, row: 0, size: { w: 1, h: 1 }, active: 0, items: [{ id: 'w0', type: 'demo.widget' }] };

describe('parseBoard', () => {
  it('parses a board with its tiles', () => {
    const result = parseBoard({ id: 'default', tiles: [VALID_TILE] }, '$.boards[0]');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBe(boardId('default'));
    expect(result.value.tiles).toHaveLength(1);
  });

  it('rejects a non-object value', () => {
    expect(parseBoard('nope', '$.boards[0]')).toEqual({
      ok: false,
      error: [{ kind: IssueKind.Malformed, path: '$.boards[0]', message: 'Expected an object at $.boards[0].' }],
    });
  });

  it('rejects a missing or non-string id', () => {
    const result = parseBoard({ tiles: [] }, '$.boards[0]');
    expect(result).toEqual({
      ok: false,
      error: [{ kind: IssueKind.Malformed, path: '$.boards[0].id', message: 'Expected a string at $.boards[0].id.' }],
    });
  });

  it('rejects a non-array tiles', () => {
    const result = parseBoard({ id: 'default', tiles: 'nope' }, '$.boards[0]');
    expect(result).toEqual({
      ok: false,
      error: [{ kind: IssueKind.Malformed, path: '$.boards[0].tiles', message: 'Expected an array at $.boards[0].tiles.' }],
    });
  });

  it('propagates a malformed tile inside tiles, with its indexed path', () => {
    const result = parseBoard({ id: 'default', tiles: [{ ...VALID_TILE, col: 'nope' }] }, '$.boards[0]');
    expect(result).toEqual({
      ok: false,
      error: [{ kind: IssueKind.Malformed, path: '$.boards[0].tiles[0].col', message: 'Expected a number at $.boards[0].tiles[0].col.' }],
    });
  });
});
