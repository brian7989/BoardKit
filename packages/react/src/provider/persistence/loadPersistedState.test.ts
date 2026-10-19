// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cell } from 'boardkit-core';
import { defineBoards } from '../config/defineBoards.js';
import { defineWidget } from '../../widget/index.js';
import { loadPersistedState } from './loadPersistedState.js';

const widget = defineWidget({ type: 'demo', title: 'Demo', sizes: [{ w: cell(1), h: cell(1) }], component: () => null });
const config = defineBoards({ grid: { cols: 4, rows: 4 }, widgets: [widget] });
const KEY = 'boardkit-persistence-test';

afterEach(() => {
  window.localStorage.clear();
});

describe('loadPersistedState', () => {
  it('returns null when nothing is saved', () => {
    expect(loadPersistedState(config, KEY)).toBeNull();
  });

  it('loads a previously saved, valid state', () => {
    window.localStorage.setItem(KEY, JSON.stringify(config.engine.serialize(config.engine.empty())));
    const loaded = loadPersistedState(config, KEY);
    expect(loaded?.grid).toEqual({ cols: 4, rows: 4 });
  });

  it('returns null for unparsable JSON instead of throwing', () => {
    window.localStorage.setItem(KEY, '{not json');
    expect(loadPersistedState(config, KEY)).toBeNull();
  });

  it('repairs an out-of-bounds tile from corrupted saved data instead of failing', () => {
    const raw = {
      version: 2,
      grid: { cols: 4, rows: 4 },
      boards: [{ id: 'default', tiles: [{ id: 't0', col: 99, row: 99, size: { w: 1, h: 1 }, active: 0, items: [{ id: 'w0', type: 'demo' }] }] }],
      layouts: {},
    };
    window.localStorage.setItem(KEY, JSON.stringify(raw));
    const loaded = loadPersistedState(config, KEY);
    const tile = loaded?.boards[0]?.tiles[0];
    expect(tile).toMatchObject({ col: 0, row: 0 });
  });

  describe('with breakpoints', () => {
    const responsive = defineBoards({
      breakpoints: {
        wide: { minWidth: 1600, grid: '16x8' },
        mid: { minWidth: 1000, grid: '12x6' },
        narrow: { minWidth: 0, grid: '4x8' },
      },
      widgets: [widget],
    });
    const laptop = responsive.breakpoints[1]?.engine;
    const savedTile = { id: 't0', col: 11, row: 5, size: { w: 1, h: 1 }, active: 0, items: [{ id: 'w0', type: 'demo' }] };

    it('loads a save made at a narrower breakpoint on that breakpoint, unchanged', () => {
      window.localStorage.setItem(KEY, JSON.stringify({ version: 3, grid: { cols: 12, rows: 6 }, boards: [{ id: 'default', tiles: [savedTile] }], layouts: {} }));
      const loaded = loadPersistedState(responsive, KEY);
      expect(loaded?.grid).toEqual({ cols: 12, rows: 6 });
      expect(loaded?.boards[0]?.tiles[0]).toMatchObject({ col: 11, row: 5 });
      expect(laptop && loaded && laptop.check(loaded)).toEqual([]);
    });

    it('rescues a save from a grid no breakpoint uses any more by reflowing it onto the widest', () => {
      window.localStorage.setItem(KEY, JSON.stringify({ version: 3, grid: { cols: 13, rows: 7 }, boards: [{ id: 'default', tiles: [{ ...savedTile, col: 12, row: 6 }] }], layouts: {} }));
      const loaded = loadPersistedState(responsive, KEY);
      expect(loaded?.grid).toEqual({ cols: 16, rows: 8 });
      expect(loaded?.boards.flatMap((board) => board.tiles.map((tile) => tile.id))).toEqual(['t0']);
    });

    it('treats a save with no readable grid as unusable rather than guessing one', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      window.localStorage.setItem('no-grid', JSON.stringify({ version: 3, grid: { cols: 0, rows: 'x' }, boards: [] }));
      expect(loadPersistedState(responsive, 'no-grid')).toBeNull();
      vi.restoreAllMocks();
    });

    it('warns in development when a save is unusable and is discarded', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      window.localStorage.setItem(KEY, JSON.stringify({ version: 3, grid: { cols: 12, rows: 6 }, boards: 'nope' }));
      expect(loadPersistedState(responsive, KEY)).toBeNull();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining(`discarded the save under "${KEY}"`));
      warn.mockRestore();
    });
  });
});
