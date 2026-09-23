// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
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
});
