// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { cell } from 'boardkit-core';
import { defineBoards } from '../config/defineBoards.js';
import { defineWidget } from '../../widget/index.js';
import { loadPersistedState } from './loadPersistedState.js';

const widget = defineWidget({ type: 'demo', title: 'Demo', sizes: [{ w: cell(1), h: cell(1) }], component: () => null });
const config = defineBoards({ grid: { cols: 4, rows: 4 }, widgets: [widget] });

describe('loadPersistedState (SSR)', () => {
  it('returns null without touching `window` when there is none', () => {
    expect(typeof window).toBe('undefined');
    expect(loadPersistedState(config, 'any-key')).toBeNull();
  });
});
