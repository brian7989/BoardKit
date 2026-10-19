// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { boardId, cell, isFree, OpType, tileId, widgetId, type BoardsState, type Engine } from 'boardkit-core';
import { defineWidget } from '../../widget/index.js';
import { defineBoards } from '../config/defineBoards.js';
import { createInitialState } from '../config/createInitialState.js';
import { restoreBoards } from './restoreBoards.js';

const w = (type: string, sizes: readonly `${number}x${number}`[]) => defineWidget({ type, title: type, sizes, component: () => null });
const config = defineBoards({
  grid: [
    { minWidth: 1000, cols: 6, rows: 4 },
    { minWidth: 600, cols: 4, rows: 4, initialLayout: [{ widget: 'a', size: '2x2', at: [2, 2] }, { widget: 'b', size: '2x2', at: [0, 0] }] },
    { minWidth: 0, cols: 2, rows: 4 },
  ],
  widgets: [w('a', ['2x2', '1x1']), w('b', ['2x2', '1x1']), w('c', ['2x2', '1x1']), w('wide', ['3x1'])],
  initialLayout: [{ widget: 'a', size: '2x2' }, { widget: 'b', size: '2x2' }, { widget: 'c', size: '1x1' }, { widget: 'wide' }],
});
const engines = config.breakpoints.map((breakpoint) => breakpoint.engine);
const WIDE = engines[0];
const MID = engines[1];
const NARROW = engines[2];
const KEY = 'edge';
const B = boardId('default');

function loadSaved(): BoardsState {
  return restoreBoards(config, JSON.parse(window.localStorage.getItem(KEY) ?? 'null'));
}

function engine(value: Engine | undefined): Engine {
  if (!value) throw new Error('missing engine');
  return value;
}

function apply(on: Engine | undefined, state: BoardsState, op: Parameters<Engine['apply']>[1]): BoardsState {
  const result = engine(on).apply(state, op);
  if (!result.ok) throw new Error(`fixture op failed: ${result.error.reason}`);
  return result.value.state;
}

// Tile id → "page:col,row wxh [types]", independent of tile order.
function positions(state: BoardsState): Record<string, string> {
  const out: Record<string, string> = {};
  for (const board of state.boards) {
    for (const tile of board.tiles) out[tile.id] = `${board.id}:${tile.col},${tile.row} ${tile.size.w}x${tile.size.h} [${tile.items.map((item) => item.type).join('+')}]`;
  }
  return out;
}

function save(raw: unknown): void {
  window.localStorage.setItem(KEY, JSON.stringify(raw));
}

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('persistence across breakpoints', () => {
  it('keeps edits on every breakpoint: wide edit, mid edit, reload on mid, then back to wide', () => {
    let state = apply(WIDE, createInitialState(config), { type: OpType.Move, board: B, tile: tileId('t-c'), to: { x: cell(5), y: cell(3) } });
    const wideEdited = positions(state);
    state = apply(MID, engine(MID).reflow(state).state, { type: OpType.Remove, board: B, tile: tileId('t-c') });
    save(engine(MID).serialize(state));

    const loaded = loadSaved();
    expect(positions(loaded)).toEqual(positions(state));
    const { ['t-c']: _removed, ...wideWithoutC } = wideEdited;
    expect(positions(engine(WIDE).reflow(loaded).state)).toEqual(wideWithoutC);
  });

  it('keeps a widget parked at the narrowest breakpoint through a save, a reload and a widen', () => {
    const narrow = engine(NARROW).reflow(createInitialState(config)).state;
    expect(narrow.parked.map((tile) => tile.id)).toEqual([tileId('t-wide')]);
    save(engine(NARROW).serialize(narrow));
    const widened = engine(WIDE).reflow(loadSaved()).state;
    expect(positions(widened)).toEqual(positions(createInitialState(config)));
  });

  it('migrates an old v2 save made on a narrow grid, float included', () => {
    save({ version: 2, grid: { cols: 2, rows: 4 }, boards: [{ id: 'default', tiles: [{ id: 't0', col: 0, row: 0, size: { w: 1, h: 1 }, active: 0, items: [{ id: 'w0', type: 'a' }], float: { x: 0.5, y: 0.5 } }] }] });
    const loaded = loadSaved();
    const tile = loaded.boards[0]?.tiles[0];
    expect(loaded.grid).toEqual({ cols: 2, rows: 4 });
    expect(tile && isFree(tile)).toBe(true);
  });

  it('drops an unregistered widget from a narrow save and keeps the rest', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const tile = (id: string, col: number, type: string) => ({ id, col, row: 0, size: { w: 1, h: 1 }, active: 0, items: [{ id: `w${id}`, type }] });
    save({ version: 3, grid: { cols: 2, rows: 4 }, boards: [{ id: 'default', tiles: [tile('t0', 0, 'a'), tile('t1', 1, 'retired')] }], layouts: {} });
    expect(Object.keys(positions(loadSaved()))).toEqual(['t0']);
  });

  it('relocates an out-of-bounds tile in a narrow save instead of discarding the save', () => {
    save({ version: 3, grid: { cols: 2, rows: 4 }, boards: [{ id: 'default', tiles: [{ id: 't0', col: 5, row: 0, size: { w: 1, h: 1 }, active: 0, items: [{ id: 'w0', type: 'a' }] }] }], layouts: {} });
    const loaded = loadSaved();
    expect(loaded.grid).toEqual({ cols: 2, rows: 4 });
    expect(loaded.boards[0]?.tiles[0]?.col).toBeLessThan(2);
  });

  it('round-trips stacks, new stacked widgets and floating tiles saved at mid', () => {
    let state = engine(MID).reflow(createInitialState(config)).state;
    state = apply(MID, state, { type: OpType.StackNew, board: B, onto: tileId('t-a'), widget: { id: widgetId('w-x'), type: 'c', props: { k: 1 } } });
    state = apply(MID, state, { type: OpType.SetFloating, board: B, tile: tileId('t-b'), floating: true });
    save(engine(MID).serialize(state));
    const loaded = loadSaved();
    expect(positions(loaded)).toEqual(positions(state));
    expect(loaded.boards[0]?.tiles.find((tile) => tile.id === tileId('t-a'))?.items[1]?.props).toEqual({ k: 1 });
  });

  it('ignores remembered layouts for tiles that no longer exist and for grids no longer used', () => {
    const state = engine(MID).reflow(createInitialState(config)).state;
    save({ ...engine(MID).serialize(state), layouts: { ...state.layouts, '9x9': [{ tile: 'ghost', board: 'default', col: 0, row: 0, size: { w: 1, h: 1 } }] } });
    const loaded = loadSaved();
    expect(positions(loaded)).toEqual(positions(state));
    expect(positions(engine(WIDE).reflow(loaded).state)).toEqual(positions(createInitialState(config)));
  });

  it('starts from the authored layouts, with a warning, for a save from a newer version', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    save({ version: 99, grid: { cols: 2, rows: 4 }, boards: [] });
    expect(positions(loadSaved())).toEqual(positions(createInitialState(config)));
    expect(warn).toHaveBeenCalled();
  });
});
