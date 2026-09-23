import { describe, expect, it } from 'vitest';
import { readNumber } from './readNumber.js';
import { IssueKind } from '../../issues/IssueKind.js';

describe('readNumber', () => {
  it('accepts a finite number, including zero and negatives', () => {
    expect(readNumber(0, '$')).toEqual({ ok: true, value: 0 });
    expect(readNumber(-4, '$')).toEqual({ ok: true, value: -4 });
  });

  it.each([['a string', '1'], ['NaN', NaN], ['null', null], ['undefined', undefined], ['a boolean', true]])(
    'rejects %s as Malformed',
    (_label, value) => {
      const result = readNumber(value, '$.field');
      expect(result).toEqual({ ok: false, error: { kind: IssueKind.Malformed, path: '$.field', message: 'Expected a number at $.field.' } });
    },
  );
});
