import { describe, expect, it } from 'vitest';
import { Direction } from './Direction.js';

describe('Direction', () => {
  it('has exactly the four cardinal members', () => {
    expect(Object.values(Direction).sort()).toEqual(['down', 'left', 'right', 'up'].sort());
  });
});
