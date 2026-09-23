import { describe, expect, it } from 'vitest';
import { markValid } from './BoardsState.js';

describe('markValid', () => {
  it('defaults layouts to an empty map when the candidate omits it', () => {
    const state = markValid({ grid: { cols: 1, rows: 1 }, boards: [] });
    expect(state.layouts).toEqual({});
  });

  it('carries an explicit layouts map through unchanged', () => {
    const layouts = { '1x1': [] };
    const state = markValid({ grid: { cols: 1, rows: 1 }, boards: [], layouts });
    expect(state.layouts).toBe(layouts);
  });
});
