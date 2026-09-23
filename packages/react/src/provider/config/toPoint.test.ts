import { describe, expect, it } from 'vitest';
import { cell } from 'boardkit-core';
import { toPoint } from './toPoint.js';

describe('toPoint', () => {
  it('reads a [col, row] tuple', () => {
    expect(toPoint([2, 3])).toEqual({ x: cell(2), y: cell(3) });
  });

  it('reads an {x, y} point', () => {
    expect(toPoint({ x: 2, y: 3 })).toEqual({ x: cell(2), y: cell(3) });
  });
});
