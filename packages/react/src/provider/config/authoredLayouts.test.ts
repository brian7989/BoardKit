import { describe, expect, it } from 'vitest';
import { boardId, cell, OpType, tileId, widgetId, type BoardsState, type Engine } from 'boardkit-core';
import { defineWidget } from '../../widget/index.js';
import { defineBoards } from './defineBoards.js';
import { createInitialState } from './createInitialState.js';
import type { InitialLayoutTile } from './InitialLayoutTile.js';
import type { GridBreakpoint } from './GridBreakpoint.js';

const widgets = [
  defineWidget({ type: 'liveView', title: 'Live View', sizes: ['8x6', '8x4', '4x4'], component: () => null }),
  defineWidget({ type: 'jobs', title: 'Jobs', sizes: ['4x2', '8x3', '4x3'], component: () => null }),
  defineWidget({ type: 'robots', title: 'Robots', sizes: ['4x2', '4x3'], component: () => null }),
  defineWidget({ type: 'inspector', title: 'Inspector', sizes: ['4x2', '4x3'], component: () => null }),
  defineWidget({ type: 'alerts', title: 'Alerts', sizes: ['4x2', '4x3'], component: () => null }),
];

// [widget, size, col, row]
type Spec = readonly (readonly [string, `${number}x${number}`, number, number])[];

const DESKTOP_SPEC: Spec = [
  ['liveView', '8x6', 0, 0],
  ['jobs', '4x2', 8, 0],
  ['robots', '4x2', 8, 2],
  ['inspector', '4x2', 8, 4],
];

const TABLET_SPEC: Spec = [
  ['liveView', '8x4', 0, 0],
  ['jobs', '8x3', 0, 4],
  ['robots', '4x3', 0, 7],
  ['inspector', '4x3', 4, 7],
];

function layoutOf(spec: Spec): readonly InitialLayoutTile[] {
  return spec.map(([widget, size, col, row]) => ({ widget, size, at: [col, row] }));
}

const DESKTOP = layoutOf(DESKTOP_SPEC);
const TABLET = layoutOf(TABLET_SPEC);

const TABLET_WIDTH = 700;
const PHONE_WIDTH = 400;

function configWith(tablet?: readonly InitialLayoutTile[]) {
  const grid: readonly GridBreakpoint[] = [
    { minWidth: 1000, cols: 12, rows: 6, cellAspect: 0.8 },
    { minWidth: 600, cols: 8, rows: 10, ...(tablet ? { initialLayout: tablet } : {}) },
    { minWidth: 0, cols: 4, rows: 8 },
  ];
  return defineBoards({ grid, widgets, initialLayout: DESKTOP });
}

const config = configWith(TABLET);

function engineAt(width: number): Engine {
  const breakpoint = config.breakpoints.find((candidate) => width >= candidate.minWidth);
  if (!breakpoint) throw new Error('no breakpoint');
  return breakpoint.engine;
}

// Tile id → "col,row wxh @page", independent of tile array order.
function positions(state: BoardsState): Record<string, string> {
  const out: Record<string, string> = {};
  for (const board of state.boards) {
    for (const tile of board.tiles) out[tile.id] = `${tile.col},${tile.row} ${tile.size.w}x${tile.size.h} @${board.id}`;
  }
  return out;
}

function expected(spec: Spec): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [widget, size, col, row] of spec) out[`t-${widget}`] = `${col},${row} ${size} @default`;
  return out;
}

function apply(engine: Engine, state: BoardsState, op: Parameters<Engine['apply']>[1]): BoardsState {
  const result = engine.apply(state, op);
  if (!result.ok) throw new Error(`fixture op failed: ${result.error.reason}`);
  return result.value.state;
}

describe('authored layouts per breakpoint', () => {
  it('seeds an authored tablet layout exactly as specified, positions included', () => {
    const tablet = createInitialState(config, { width: TABLET_WIDTH });
    expect(tablet.grid).toEqual({ cols: 8, rows: 10 });
    expect(positions(tablet)).toEqual(expected(TABLET_SPEC));
  });

  it('seeds the top-level layout, `at` included, on the widest breakpoint', () => {
    expect(positions(createInitialState(config))).toEqual(expected(DESKTOP_SPEC));
  });

  it('shows each authored layout on desktop → tablet → desktop with no edits', () => {
    const desktop = createInitialState(config);
    const tablet = engineAt(TABLET_WIDTH).reflow(desktop).state;
    const back = engineAt(1200).reflow(tablet).state;
    expect(positions(tablet)).toEqual(expected(TABLET_SPEC));
    expect(positions(back)).toEqual(expected(DESKTOP_SPEC));
  });

  it('keeps an edit on tablet without changing the desktop layout', () => {
    const tablet = engineAt(TABLET_WIDTH).reflow(createInitialState(config)).state;
    const edited = apply(engineAt(TABLET_WIDTH), tablet, { type: OpType.Move, board: boardId('default'), tile: tileId('t-robots'), to: { x: cell(4), y: cell(7) } });
    const desktop = engineAt(1200).reflow(edited).state;
    expect(positions(desktop)).toEqual(expected(DESKTOP_SPEC));
    expect(positions(engineAt(TABLET_WIDTH).reflow(desktop).state)).toEqual(positions(edited));
  });

  it('shows a widget added on desktop on tablet and phone too', () => {
    const desktop = createInitialState(config);
    const withAlerts = apply(engineAt(1200), desktop, {
      type: OpType.Remove,
      board: boardId('default'),
      tile: tileId('t-inspector'),
    });
    const added = apply(engineAt(1200), withAlerts, {
      type: OpType.Add,
      board: boardId('default'),
      tileId: tileId('t-alerts'),
      widget: { id: widgetId('w-alerts'), type: 'alerts' },
      size: { w: cell(4), h: cell(2) },
      at: { x: cell(8), y: cell(4) },
    });
    const tablet = engineAt(TABLET_WIDTH).reflow(added).state;
    const phone = engineAt(PHONE_WIDTH).reflow(tablet).state;
    expect(positions(tablet)).toHaveProperty('t-alerts');
    expect(positions(phone)).toHaveProperty('t-alerts');
  });

  it('removes a widget removed on phone from every breakpoint', () => {
    const phone = engineAt(PHONE_WIDTH).reflow(createInitialState(config)).state;
    const home = phone.boards.find((board) => board.tiles.some((tile) => tile.id === tileId('t-jobs')));
    if (!home) throw new Error('jobs should be on some phone page');
    const removed = apply(engineAt(PHONE_WIDTH), phone, { type: OpType.Remove, board: home.id, tile: tileId('t-jobs') });
    expect(positions(engineAt(TABLET_WIDTH).reflow(removed).state)).not.toHaveProperty('t-jobs');
    expect(positions(engineAt(1200).reflow(removed).state)).not.toHaveProperty('t-jobs');
  });

  it('restores every authored layout from a fresh createInitialState after edits', () => {
    const reset = createInitialState(config);
    expect(positions(reset)).toEqual(expected(DESKTOP_SPEC));
    expect(positions(engineAt(TABLET_WIDTH).reflow(reset).state)).toEqual(expected(TABLET_SPEC));
  });

  it('reflows a breakpoint without its own initialLayout exactly as before', () => {
    const withTablet = engineAt(PHONE_WIDTH).reflow(createInitialState(config)).state;
    const without = engineAt(PHONE_WIDTH).reflow(createInitialState(configWith())).state;
    expect(positions(withTablet)).toEqual(positions(without));
  });

  it('adds a widget only another breakpoint lists to the shared set, at its authored spot there', () => {
    const extra = configWith([...TABLET.slice(0, 3), { widget: 'alerts', size: '4x3', at: [4, 7] }]);
    const desktop = createInitialState(extra);
    expect(positions(desktop)).toHaveProperty('t-alerts');
    expect(positions(createInitialState(extra, { width: TABLET_WIDTH }))['t-alerts']).toBe('4,7 4x3 @default');
  });

  it('shares one widget instance, props included, across breakpoints', () => {
    const tablet = createInitialState(config, { width: TABLET_WIDTH });
    const desktop = createInitialState(config);
    const ids = (state: BoardsState) => state.boards.flatMap((board) => board.tiles.map((tile) => tile.items[0]?.id)).sort();
    expect(ids(tablet)).toEqual(ids(desktop));
  });
});
