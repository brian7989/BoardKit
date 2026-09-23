import { describe, expect, it } from 'vitest';
import { readObject } from './readObject.js';
import { IssueKind } from '../../issues/IssueKind.js';

describe('readObject', () => {
  it('accepts a plain object', () => {
    const result = readObject({ a: 1 }, '$');
    expect(result).toEqual({ ok: true, value: { a: 1 } });
  });

  it.each([['a string', 'x'], ['a number', 1], ['null', null], ['undefined', undefined], ['an array', [1, 2]]])(
    'rejects %s as Malformed',
    (_label, value) => {
      const result = readObject(value, '$.field');
      expect(result).toEqual({ ok: false, error: { kind: IssueKind.Malformed, path: '$.field', message: 'Expected an object at $.field.' } });
    },
  );
});
