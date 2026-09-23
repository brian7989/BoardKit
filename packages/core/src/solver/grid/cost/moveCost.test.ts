import { describe, expect, it } from 'vitest';
import { moveCost } from './moveCost.js';
import { Direction } from './Direction.js';
import { cell } from '../../../shared/units/Cell.js';

const ORDER = [Direction.Down, Direction.Right, Direction.Up, Direction.Left];
const RECT = { x: cell(2), y: cell(2), w: cell(1), h: cell(1) };

describe('moveCost', () => {
  it('reports Down for a move with dy > 0', () => {
    const cost = moveCost(RECT, { ...RECT, y: cell(3) }, ORDER);
    expect(cost).toEqual({ distance: 1, direction: Direction.Down, rank: 0 });
  });

  it('reports Up for a move with dy < 0', () => {
    const cost = moveCost(RECT, { ...RECT, y: cell(1) }, ORDER);
    expect(cost).toEqual({ distance: 1, direction: Direction.Up, rank: 2 });
  });

  it('reports Right for a move with dx > 0 and no vertical change', () => {
    const cost = moveCost(RECT, { ...RECT, x: cell(3) }, ORDER);
    expect(cost).toEqual({ distance: 1, direction: Direction.Right, rank: 1 });
  });

  it('reports Left for a move with dx < 0 and no vertical change', () => {
    const cost = moveCost(RECT, { ...RECT, x: cell(1) }, ORDER);
    expect(cost).toEqual({ distance: 1, direction: Direction.Left, rank: 3 });
  });

  it('defaults an unmoved rect to Down, with distance 0', () => {
    const cost = moveCost(RECT, RECT, ORDER);
    expect(cost).toEqual({ distance: 0, direction: Direction.Down, rank: 0 });
  });

  it('sums L1 distance across both axes', () => {
    const cost = moveCost(RECT, { x: cell(4), y: cell(5), w: cell(1), h: cell(1) }, ORDER);
    expect(cost.distance).toBe(5);
  });

  it('ranks a direction absent from the preferred order as unranked', () => {
    const cost = moveCost(RECT, { ...RECT, x: cell(3) }, [Direction.Down]);
    expect(cost).toEqual({ distance: 1, direction: Direction.Right, rank: 4 });
  });
});
