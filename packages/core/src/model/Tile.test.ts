import { describe, expect, it } from 'vitest';
import { activeItem, firstItem, isFloating, isStack } from './Tile.js';
import { widgetId } from '../shared/ids/WidgetId.js';
import { tileId } from '../shared/ids/TileId.js';
import { cell } from '../shared/units/Cell.js';
import type { Tile } from './Tile.js';

function makeTile(overrides: Partial<Tile> = {}): Tile {
  return {
    id: tileId('t0'),
    col: cell(0),
    row: cell(0),
    size: { w: cell(1), h: cell(1) },
    items: [{ id: widgetId('w0'), type: 'demo.widget' }],
    active: 0,
    ...overrides,
  };
}

describe('isStack', () => {
  it('is false for a single-item tile and true for more than one', () => {
    expect(isStack(makeTile())).toBe(false);
    expect(isStack(makeTile({ items: [{ id: widgetId('w0'), type: 'a' }, { id: widgetId('w1'), type: 'a' }] }))).toBe(true);
  });
});

describe('isFloating', () => {
  it('is false without a float position and true with one', () => {
    expect(isFloating(makeTile())).toBe(false);
    expect(isFloating(makeTile({ float: { x: 1, y: 1 } }))).toBe(true);
  });
});

describe('firstItem', () => {
  it('returns the first item', () => {
    const tile = makeTile({ items: [{ id: widgetId('w0'), type: 'a' }, { id: widgetId('w1'), type: 'b' }] });
    expect(firstItem(tile).id).toBe(widgetId('w0'));
  });

  it('throws for a tile with no items', () => {
    expect(() => firstItem(makeTile({ items: [] }))).toThrow('Invalid tile: items must be non-empty.');
  });
});

describe('activeItem', () => {
  it('returns the item at the active index', () => {
    const tile = makeTile({ items: [{ id: widgetId('w0'), type: 'a' }, { id: widgetId('w1'), type: 'b' }], active: 1 });
    expect(activeItem(tile).id).toBe(widgetId('w1'));
  });

  it('falls back to the first item when active is out of range', () => {
    const tile = makeTile({ items: [{ id: widgetId('w0'), type: 'a' }], active: 5 });
    expect(activeItem(tile).id).toBe(widgetId('w0'));
  });
});
