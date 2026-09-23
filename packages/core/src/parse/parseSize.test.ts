import { describe, expect, it } from 'vitest';
import { parseSize } from './parseSize.js';
import { IssueKind } from '../issues/IssueKind.js';

describe('parseSize', () => {
  it('parses a valid {w,h} object', () => {
    const result = parseSize({ w: 2, h: 3 }, '$.size');
    expect(result).toEqual({ ok: true, value: { w: 2, h: 3 } });
  });

  it('rejects a non-object value', () => {
    const result = parseSize('nope', '$.size');
    expect(result).toEqual({ ok: false, error: [{ kind: IssueKind.Malformed, path: '$.size', message: 'Expected an object at $.size.' }] });
  });

  it('rejects a missing or non-numeric w', () => {
    const result = parseSize({ h: 1 }, '$.size');
    expect(result).toEqual({ ok: false, error: [{ kind: IssueKind.Malformed, path: '$.size.w', message: 'Expected a number at $.size.w.' }] });
  });

  it('rejects a missing or non-numeric h', () => {
    const result = parseSize({ w: 1, h: 'x' }, '$.size');
    expect(result).toEqual({ ok: false, error: [{ kind: IssueKind.Malformed, path: '$.size.h', message: 'Expected a number at $.size.h.' }] });
  });
});
