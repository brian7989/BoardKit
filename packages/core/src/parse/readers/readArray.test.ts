import { describe, expect, it } from 'vitest';
import { readArray } from './readArray.js';
import { IssueKind } from '../../issues/IssueKind.js';

describe('readArray', () => {
  it('accepts an array', () => {
    expect(readArray([1, 2, 3], '$')).toEqual({ ok: true, value: [1, 2, 3] });
  });

  it.each([['an object', { length: 0 }], ['a string', 'abc'], ['a number', 1], ['null', null]])('rejects %s as Malformed', (_label, value) => {
    const result = readArray(value, '$.field');
    expect(result).toEqual({ ok: false, error: { kind: IssueKind.Malformed, path: '$.field', message: 'Expected an array at $.field.' } });
  });
});
