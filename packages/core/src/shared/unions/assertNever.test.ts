import { describe, expect, it } from 'vitest';
import { assertNever } from './assertNever.js';

describe('assertNever', () => {
  it('throws naming the unreachable value', () => {
    const bogus = { bogus: true };
    function callWithBogus(): never {
      // @ts-expect-error intentionally passing a value the closed-set type rules out
      return assertNever(bogus);
    }
    expect(callWithBogus).toThrow('Unreachable case: {"bogus":true}');
  });
});
