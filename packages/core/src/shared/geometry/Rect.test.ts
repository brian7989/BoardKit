import { describe, expect, it } from 'vitest';
import { rectsEqual, rectsIntersect } from './Rect.js';

describe('rectsIntersect', () => {
  it('is true for overlapping rects', () => {
    expect(rectsIntersect({ x: 0, y: 0, w: 2, h: 2 }, { x: 1, y: 1, w: 2, h: 2 })).toBe(true);
  });

  it('is false for rects that only share an edge', () => {
    expect(rectsIntersect({ x: 0, y: 0, w: 2, h: 2 }, { x: 2, y: 0, w: 2, h: 2 })).toBe(false);
  });

  it('is false for rects that only share a corner', () => {
    expect(rectsIntersect({ x: 0, y: 0, w: 2, h: 2 }, { x: 2, y: 2, w: 2, h: 2 })).toBe(false);
  });

  it('is false for disjoint rects', () => {
    expect(rectsIntersect({ x: 0, y: 0, w: 1, h: 1 }, { x: 5, y: 5, w: 1, h: 1 })).toBe(false);
  });

  it('is true when one rect fully contains the other', () => {
    expect(rectsIntersect({ x: 0, y: 0, w: 4, h: 4 }, { x: 1, y: 1, w: 1, h: 1 })).toBe(true);
  });
});

describe('rectsEqual', () => {
  it('is true for identical rects and false when any field differs', () => {
    expect(rectsEqual({ x: 0, y: 0, w: 1, h: 1 }, { x: 0, y: 0, w: 1, h: 1 })).toBe(true);
    expect(rectsEqual({ x: 0, y: 0, w: 1, h: 1 }, { x: 1, y: 0, w: 1, h: 1 })).toBe(false);
  });
});
