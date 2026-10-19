import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BoardsState, Engine } from 'boardkit-core';
import { defineWidget } from '../../widget/index.js';
import { defineBoards } from './defineBoards.js';
import { createInitialState } from './createInitialState.js';
import type { BoardsConfig } from './BoardsConfig.js';

const widget = (type: string, sizes: readonly `${number}x${number}`[]) => defineWidget({ type, title: type, sizes, component: () => null });
const widgets = [
  widget('liveView', ['8x6', '8x4', '4x4']),
  widget('jobs', ['8x2', '4x4']),
  widget('robots', ['4x4', '4x3']),
  widget('requestors', ['4x4']),
  widget('alerts', ['4x4']),
  widget('inspector', ['4x4', '4x3']),
];

// The breakpoints guide's example: wall, laptop (hiding two), a derived tablet, and a phone.
function homeBoards() {
  return defineBoards({
    widgets,
    breakpoints: {
      wall: {
        minWidth: 1800,
        grid: '16x8',
        layout: [
          { widget: 'liveView', size: '8x6', at: [0, 0] },
          { widget: 'jobs', size: '8x2', at: [0, 6] },
          { widget: 'robots', size: '4x4', at: [8, 0] },
          { widget: 'requestors', size: '4x4', at: [8, 4] },
          { widget: 'alerts', size: '4x4', at: [12, 0] },
          { widget: 'inspector', size: '4x4', at: [12, 4] },
        ],
      },
      laptop: {
        minWidth: 1000,
        grid: '12x6',
        hide: ['requestors', 'alerts'],
        layout: [
          { widget: 'liveView', size: '8x4', at: [0, 0] },
          { widget: 'jobs', size: '8x2', at: [0, 4] },
          { widget: 'inspector', size: '4x3', at: [8, 0] },
          { widget: 'robots', size: '4x3', at: [8, 3] },
        ],
      },
      tablet: { minWidth: 600, grid: '8x10' },
      phone: {
        minWidth: 0,
        grid: '4x16',
        hide: ['requestors', 'alerts'],
        layout: [
          { widget: 'liveView', size: '4x4', at: [0, 0] },
          { widget: 'inspector', size: '4x4', at: [0, 4] },
          { widget: 'jobs', size: '4x4', at: [0, 8] },
          { widget: 'robots', size: '4x4', at: [0, 12] },
        ],
      },
    },
  });
}

function engineOf(config: BoardsConfig, name: string): Engine {
  const breakpoint = config.breakpoints.find((candidate) => candidate.name === name);
  if (!breakpoint) throw new Error(`no breakpoint ${name}`);
  return breakpoint.engine;
}

function shown(state: BoardsState): readonly string[] {
  return state.boards.flatMap((board) => board.tiles.flatMap((tile) => tile.items.map((item) => item.type))).sort();
}

// Tile id → "page:col,row wxh", independent of tile order.
function positions(state: BoardsState): Record<string, string> {
  const out: Record<string, string> = {};
  for (const board of state.boards) for (const tile of board.tiles) out[tile.id] = `${board.id}:${tile.col},${tile.row} ${tile.size.w}x${tile.size.h}`;
  return out;
}

function warnings(spy: ReturnType<typeof vi.spyOn>): readonly string[] {
  return spy.mock.calls.map((call) => String(call[0]));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('named breakpoints', () => {
  it('leaves hidden widgets off a breakpoint and shows them again on the others', () => {
    const config = homeBoards();
    const wall = createInitialState(config);
    expect(shown(wall)).toEqual(['alerts', 'inspector', 'jobs', 'liveView', 'requestors', 'robots']);
    const laptop = engineOf(config, 'laptop').reflow(wall).state;
    expect(shown(laptop)).toEqual(['inspector', 'jobs', 'liveView', 'robots']);
    expect(laptop.parked.map((tile) => tile.items[0]?.type).sort()).toEqual(['alerts', 'requestors']);
    expect(shown(engineOf(config, 'wall').reflow(laptop).state)).toEqual(shown(wall));
  });

  it('keeps a widget hidden after the user rearranges that breakpoint and leaves and comes back', () => {
    const config = homeBoards();
    const laptop = createInitialState(config, { width: 1200 });
    const backToLaptop = engineOf(config, 'laptop').reflow(engineOf(config, 'phone').reflow(laptop).state).state;
    expect(shown(backToLaptop)).toEqual(['inspector', 'jobs', 'liveView', 'robots']);
  });

  it('derives a breakpoint without a layout from the nearest wider one, hidden widgets included', () => {
    const config = homeBoards();
    const tablet = createInitialState(config, { width: 700 });
    expect(shown(tablet)).toEqual(['inspector', 'jobs', 'liveView', 'robots']);
    const viaPhone = engineOf(config, 'tablet').reflow(createInitialState(config, { width: 400 })).state;
    expect(positions(viaPhone)).toEqual(positions(tablet));
  });

  it('lets a breakpoint without a layout hide widgets of its own', () => {
    const config = defineBoards({
      widgets,
      breakpoints: {
        wide: { minWidth: 900, grid: '16x8', layout: [{ widget: 'robots' }, { widget: 'alerts' }] },
        narrow: { minWidth: 0, grid: '4x8', hide: ['alerts'] },
      },
    });
    expect(shown(createInitialState(config, { width: 400 }))).toEqual(['robots']);
  });

  it('keeps a widget that only another layout stacks, instead of losing it', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const config = defineBoards({
      widgets,
      breakpoints: {
        wide: { minWidth: 900, grid: '16x8', layout: [{ widget: 'jobs', size: '4x4' }] },
        narrow: { minWidth: 0, grid: '4x8', layout: [{ widget: 'jobs', size: '4x4', stack: [{ widget: 'robots' }] }] },
      },
    });
    expect(shown(createInitialState(config))).toEqual(['jobs', 'robots']);
  });
});

describe('layout warnings', () => {
  it('names a widget a layout leaves out without hiding it, and the page it went to', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    defineBoards({
      widgets,
      breakpoints: {
        wide: { minWidth: 900, grid: '8x4', layout: [{ widget: 'liveView', size: '8x4' }, { widget: 'alerts', size: '4x4' }] },
        narrow: { minWidth: 0, grid: '4x4', layout: [{ widget: 'liveView', size: '4x4' }] },
      },
    });
    expect(warnings(warn)).toContainEqual(expect.stringContaining('"alerts" isn\'t in the "narrow" layout, so it was placed at the first free spot (page 2)'));
  });

  it('says nothing about the breakpoints guide example, whose layouts list or hide every widget', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    homeBoards();
    expect(warnings(warn)).toEqual([]);
  });

  it('warns when a layout stacks widgets the primary layout keeps apart', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    defineBoards({
      widgets,
      breakpoints: {
        wide: { minWidth: 900, grid: '16x8', layout: [{ widget: 'jobs', size: '4x4' }, { widget: 'robots', size: '4x4' }] },
        thin: { minWidth: 0, grid: '4x8', layout: [{ widget: 'jobs', size: '4x4', stack: [{ widget: 'robots' }] }] },
      },
    });
    expect(warnings(warn)).toContainEqual(expect.stringContaining('the "thin" layout stacks jobs + robots, but "wide" has them on separate tiles'));
  });

  it('warns when a layout splits a stack the primary layout has', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    defineBoards({
      widgets,
      breakpoints: {
        wide: { minWidth: 900, grid: '16x8', layout: [{ widget: 'jobs', size: '4x4', stack: [{ widget: 'robots' }] }] },
        split: { minWidth: 0, grid: '4x8', layout: [{ widget: 'jobs', size: '4x4' }, { widget: 'robots', size: '4x4' }] },
      },
    });
    expect(warnings(warn)).toContainEqual(expect.stringContaining('the "split" layout has jobs, robots on separate tiles, but "wide" stacks jobs + robots'));
  });

  it('warns when `hide` names only part of a stack', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    defineBoards({
      widgets,
      breakpoints: {
        wide: { minWidth: 900, grid: '16x8', layout: [{ widget: 'jobs', size: '4x4', stack: [{ widget: 'robots' }] }] },
        partial: { minWidth: 0, grid: '4x8', hide: ['robots'] },
      },
    });
    expect(warnings(warn)).toContainEqual(expect.stringContaining('"partial" hides only part of the jobs + robots stack'));
  });
});
