// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import { cell } from 'boardkit-core';
import { defineBoards } from '../config/defineBoards.js';
import { defineWidget } from '../../widget/index.js';
import { useBoardsPersistence } from './useBoardsPersistence.js';

const widget = defineWidget({ type: 'demo', title: 'Demo', sizes: [{ w: cell(1), h: cell(1) }], component: () => null });
const config = defineBoards({ grid: { cols: 4, rows: 4 }, widgets: [widget] });
const KEY = 'boardkit-persistence-save-test';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.localStorage.clear();
});

describe('useBoardsPersistence', () => {
  it('saves the state to localStorage after the debounce window', () => {
    const state = config.engine.empty();
    renderHook(() => useBoardsPersistence({ storageKey: KEY, engine: config.engine, state, enabled: true }));
    expect(window.localStorage.getItem(KEY)).toBeNull();
    vi.advanceTimersByTime(250);
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify(config.engine.serialize(state)));
  });

  it('does not save when disabled (controlled mode)', () => {
    const state = config.engine.empty();
    renderHook(() => useBoardsPersistence({ storageKey: KEY, engine: config.engine, state, enabled: false }));
    vi.advanceTimersByTime(250);
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('does not save without a storageKey', () => {
    const state = config.engine.empty();
    renderHook(() => useBoardsPersistence({ engine: config.engine, state, enabled: true }));
    vi.advanceTimersByTime(250);
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('flushes immediately on pagehide', () => {
    const state = config.engine.empty();
    renderHook(() => useBoardsPersistence({ storageKey: KEY, engine: config.engine, state, enabled: true }));
    window.dispatchEvent(new Event('pagehide'));
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify(config.engine.serialize(state)));
  });
});
