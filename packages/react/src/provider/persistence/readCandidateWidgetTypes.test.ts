import { describe, expect, it } from 'vitest';
import { readCandidateWidgetTypes } from './readCandidateWidgetTypes.js';

describe('readCandidateWidgetTypes', () => {
  it('collects every item type across boards and tiles', () => {
    const raw = { boards: [{ tiles: [{ items: [{ type: 'weather' }] }, { items: [{ type: 'clock' }, { type: 'weather' }] }] }] };
    expect(readCandidateWidgetTypes(raw)).toEqual(['weather', 'clock', 'weather']);
  });

  it('returns nothing for malformed or missing data', () => {
    expect(readCandidateWidgetTypes(null)).toEqual([]);
    expect(readCandidateWidgetTypes('nope')).toEqual([]);
    expect(readCandidateWidgetTypes({})).toEqual([]);
    expect(readCandidateWidgetTypes({ boards: 'nope' })).toEqual([]);
  });
});
