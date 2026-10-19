import { describe, expect, it, vi } from 'vitest';
import { boardId, cell, OpType, tileId, widgetId, type BoardsState, type Engine } from 'boardkit-core';
import { defineWidget } from '../../widget/index.js';
import { defineBoards } from './defineBoards.js';
import { createInitialState } from './createInitialState.js';
import type { LayoutEntry } from './LayoutEntry.js';

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

function layoutOf(spec: Spec): readonly LayoutEntry[] {
  return spec.map(([widget, size, col, row]) => ({ widget, size, at: [col, row] }));
}

const DESKTOP = layoutOf(DESKTOP_SPEC);
const TABLET = layoutOf(TABLET_SPEC);

const TABLET_WIDTH = 700;
const PHONE_WIDTH = 400;

function configWith(tablet?: readonly LayoutEntry[]) {
  return defineBoards({
    widgets,
    breakpoints: {
      desktop: { minWidth: 1000, grid: '12x6', cellAspect: 0.8, layout: DESKTOP },
      tablet: { minWidth: 600, grid: '8x10', ...(tablet ? { layout: tablet } : {}) },
      phone: { minWidth: 0, grid: '4x8' },
    },
  });
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

  it('starts a breakpoint without a layout from the nearest wider one, whichever breakpoint the board comes from', () => {
    const fromDesktop = engineAt(PHONE_WIDTH).reflow(createInitialState(config)).state;
    const fromTablet = engineAt(PHONE_WIDTH).reflow(createInitialState(config, { width: TABLET_WIDTH })).state;
    expect(positions(fromDesktop)).toEqual(positions(fromTablet));
    const viaTablet = engineAt(PHONE_WIDTH).reflow(engineAt(TABLET_WIDTH).reflow(createInitialState(configWith())).state).state;
    expect(positions(fromDesktop)).not.toEqual(positions(viaTablet));
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

  it('keeps a stack authored on desktop as one tile on tablet, without duplicating its widgets', () => {
    const stacked = defineBoards({
      breakpoints: {
        wide: { minWidth: 1000, grid: '12x6', cellAspect: 0.8, layout: [DESKTOP[0], DESKTOP[1], { widget: 'robots', size: '4x2', at: [8, 2], stack: [{ widget: 'inspector' }] }].filter((entry) => entry !== undefined) },
        mid: { minWidth: 600, grid: '8x10', layout: TABLET },
        narrow: { minWidth: 0, grid: '4x8' },
      },
      widgets,
    });
    const tablet = createInitialState(stacked, { width: TABLET_WIDTH });
    const widgetsOnTablet = tablet.boards.flatMap((board) => board.tiles.flatMap((tile) => tile.items.map((item) => item.id)));
    expect(widgetsOnTablet.filter((id) => id === 'w-inspector')).toHaveLength(1);
    expect(positions(tablet)['t-robots']).toBe('0,7 4x3 @default');
  });
});

describe('authored layout edge cases', () => {
  const single = (layout: readonly LayoutEntry[]) => createInitialState(defineBoards({ grid: { cols: 4, rows: 2 }, widgets, layout }));

  it('first-fits an entry whose `at` is off the board instead of dropping it', () => {
    expect(Object.keys(positions(single([{ widget: 'robots', size: '4x2', at: [9, 9] }])))).toEqual(['t-robots']);
  });

  it('warns and falls back to the default size for an authored size the widget does not allow', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(positions(single([{ widget: 'robots', size: '8x3' }]))['t-robots']).toBe('0,0 4x2 @default');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"robots" a 8x3 size it doesn\'t allow'));
    warn.mockRestore();
  });

  it('starts on the narrowest breakpoint for a width below every minWidth', () => {
    expect(createInitialState(config, { width: -50 }).grid).toEqual({ cols: 4, rows: 8 });
  });

  it('restores the authored tablet layout exactly after a detour through the phone', () => {
    const viaPhone = engineAt(TABLET_WIDTH).reflow(engineAt(PHONE_WIDTH).reflow(createInitialState(config)).state).state;
    expect(positions(viaPhone)).toEqual(expected(TABLET_SPEC));
  });
});
