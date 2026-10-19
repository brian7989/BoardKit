import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, withSavedLayout, type BoardsState, type Engine, type LayoutTile } from '../index.js';

const ONE = { w: cell(1), h: cell(1) };
const TALL = { w: cell(1), h: cell(2) };
const CATALOG = { a: { sizes: [ONE, TALL] }, b: { sizes: [ONE, TALL] }, c: { sizes: [ONE] } };
const WIDE = createEngine({ grid: { cols: 4, rows: 2 }, catalog: CATALOG });
const NARROW = createEngine({ grid: { cols: 1, rows: 4 }, catalog: CATALOG });
const B = boardId('default');

function apply(engine: Engine, state: BoardsState, op: Parameters<Engine['apply']>[1]): BoardsState {
  const result = engine.apply(state, op);
  if (!result.ok) throw new Error(`fixture op failed: ${result.error.reason}`);
  return result.value.state;
}

function add(state: BoardsState, type: string, x: number): BoardsState {
  return apply(WIDE, state, { type: OpType.Add, board: B, tileId: tileId(`t-${type}`), widget: { id: widgetId(`w-${type}`), type }, size: ONE, at: { x: cell(x), y: cell(0) } });
}

// Each tile as "id: widget types", sorted, so composition is compared regardless of order.
function stacks(state: BoardsState): readonly string[] {
  return state.boards.flatMap((board) => board.tiles.map((tile) => `${tile.id}: ${tile.items.map((item) => item.type).join('+')}`)).sort();
}

// a, b and c side by side on the wide grid; on the narrow one, a and b stacked.
function seeded(): BoardsState {
  const wide = add(add(add(WIDE.empty(), 'a', 0), 'b', 1), 'c', 2);
  const narrow = apply(NARROW, NARROW.reflow(wide).state, { type: OpType.Stack, board: B, from: tileId('t-b'), onto: tileId('t-a') });
  return withSavedLayout(wide, narrow);
}

describe('stacks per breakpoint', () => {
  it('keeps a stack made on one breakpoint to that breakpoint, both ways round', () => {
    const narrow = NARROW.reflow(seeded()).state;
    expect(stacks(narrow)).toEqual(['t-a: a+b', 't-c: c']);
    const wide = WIDE.reflow(narrow).state;
    expect(stacks(wide)).toEqual(['t-a: a', 't-b: b', 't-c: c']);
    expect(stacks(NARROW.reflow(wide).state)).toEqual(['t-a: a+b', 't-c: c']);
  });

  it('keeps which widget a stack shows per breakpoint', () => {
    const narrow = apply(NARROW, NARROW.reflow(seeded()).state, { type: OpType.SetActive, board: B, tile: tileId('t-a'), index: 1 });
    const back = NARROW.reflow(WIDE.reflow(narrow).state).state;
    expect(back.boards[0]?.tiles.find((tile) => tile.id === tileId('t-a'))?.active).toBe(1);
  });

  it('shares widget content: a rename on one breakpoint shows on the others', () => {
    const narrow = apply(NARROW, NARROW.reflow(seeded()).state, { type: OpType.RenameWidget, board: B, tile: tileId('t-a'), widget: widgetId('w-b'), name: 'Bee' });
    const wide = WIDE.reflow(narrow).state;
    expect(wide.boards[0]?.tiles.find((tile) => tile.id === tileId('t-b'))?.items[0]?.displayName).toBe('Bee');
  });

  it('puts a widget stacked on since a breakpoint was saved onto the tile its stack-mates are on there', () => {
    const wide = apply(WIDE, WIDE.reflow(NARROW.reflow(seeded()).state).state, { type: OpType.StackNew, board: B, onto: tileId('t-c'), widget: { id: widgetId('w-new'), type: 'a' } });
    expect(stacks(NARROW.reflow(wide).state)).toEqual(['t-a: a+b', 't-c: c+a']);
  });

  it('gives a newly stacked widget its own tile where its stack-mates’ tile is a size it does not allow', () => {
    const base = add(WIDE.empty(), 'a', 0);
    const tallOnNarrow = apply(NARROW, NARROW.reflow(base).state, { type: OpType.Resize, board: B, tile: tileId('t-a'), size: TALL });
    const wide = apply(WIDE, withSavedLayout(base, tallOnNarrow), { type: OpType.StackNew, board: B, onto: tileId('t-a'), widget: { id: widgetId('w-c'), type: 'c' } });
    expect(stacks(NARROW.reflow(wide).state)).toEqual(['t-a-2: c', 't-a: a']);
  });

  it('drops a removed widget from every breakpoint’s stacks', () => {
    const narrow = NARROW.reflow(seeded()).state;
    const removed = apply(NARROW, narrow, { type: OpType.Remove, board: B, tile: tileId('t-a') });
    expect(stacks(WIDE.reflow(removed).state)).toEqual(['t-c: c']);
  });

  it('renames a tile whose id a saved stack already uses', () => {
    const narrow = NARROW.reflow(seeded()).state;
    const wide = WIDE.reflow(narrow).state;
    const restacked = apply(WIDE, wide, { type: OpType.Stack, board: B, from: tileId('t-a'), onto: tileId('t-c') });
    const back = NARROW.reflow(restacked).state;
    expect(stacks(back)).toEqual(['t-a: a+b', 't-c: c']);
  });

  it('keeps the tile’s own widgets for a saved entry from before stacks varied by breakpoint', () => {
    const wide = seeded();
    const legacy: readonly LayoutTile[] = (wide.layouts['1x4'] ?? []).map(({ items: _items, active: _active, ...rest }) => rest);
    const narrow = NARROW.reflow({ ...wide, layouts: { ...wide.layouts, '1x4': legacy } }).state;
    expect(stacks(narrow)).toEqual(['t-a: a', 't-b: b', 't-c: c']);
  });
});
