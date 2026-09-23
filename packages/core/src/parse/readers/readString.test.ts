import { describe, expect, it } from 'vitest';
import { readString } from './readString.js';
import { IssueKind } from '../../issues/IssueKind.js';

describe('readString', () => {
  it('accepts a string, including an empty one', () => {
    expect(readString('abc', '$')).toEqual({ ok: true, value: 'abc' });
    expect(readString('', '$')).toEqual({ ok: true, value: '' });
  });

  it.each([['a number', 1], ['null', null], ['undefined', undefined], ['an object', {}]])('rejects %s as Malformed', (_label, value) => {
    const result = readString(value, '$.field');
    expect(result).toEqual({ ok: false, error: { kind: IssueKind.Malformed, path: '$.field', message: 'Expected a string at $.field.' } });
  });
});
