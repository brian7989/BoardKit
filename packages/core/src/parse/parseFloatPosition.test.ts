import { describe, expect, it } from 'vitest';
import { parseFloatPosition } from './parseFloatPosition.js';

describe('parseFloatPosition', () => {
  it('reads a valid {x,y} pair', () => {
    expect(parseFloatPosition({ x: 1.5, y: 2 })).toEqual({ float: { x: 1.5, y: 2 } });
  });

  it('drops a missing field rather than failing', () => {
    expect(parseFloatPosition(undefined)).toEqual({});
  });

  it('drops a non-object value', () => {
    expect(parseFloatPosition('nope')).toEqual({});
  });

  it('drops an object missing x or y', () => {
    expect(parseFloatPosition({ x: 1 })).toEqual({});
    expect(parseFloatPosition({ y: 1 })).toEqual({});
  });

  it('drops an object with non-numeric x or y', () => {
    expect(parseFloatPosition({ x: 'a', y: 1 })).toEqual({});
  });
});
