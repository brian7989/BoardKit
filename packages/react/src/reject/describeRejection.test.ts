import { describe, expect, it } from 'vitest';
import { RejectReason } from 'boardkit-core';
import { describeRejection } from './describeRejection.js';

describe('describeRejection', () => {
  it('gives a friendly message for every reject reason', () => {
    for (const reason of Object.values(RejectReason)) {
      expect(describeRejection({ reason })).toEqual(expect.any(String));
    }
  });

  it('describes a specific reason', () => {
    expect(describeRejection({ reason: RejectReason.NoFreeSpace })).toBe('No room for this on the current board.');
  });
});
