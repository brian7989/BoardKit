import { afterEach, describe, expect, it, vi } from 'vitest';
import { boardId, cell, OpType, tileId, type BoardsState } from 'boardkit-core';
import { defineWidget } from '../../widget/index.js';
import { defineBoards } from '../config/defineBoards.js';
import { createInitialState } from '../config/createInitialState.js';
import { restoreBoards } from './restoreBoards.js';

const a = defineWidget({ type: 'a', title: 'A', sizes: ['1x1'], component: () => null });
const config = defineBoards({
  grid: [
    { minWidth: 800, cols: 4, rows: 2 },
    { minWidth: 0, cols: 2, rows: 2 },
  ],
  widgets: [a],
  initialLayout: [{ widget: 'a' }],
});
const NARROW_WIDTH = 400;

function colOf(state: BoardsState): number | undefined {
  return state.boards[0]?.tiles[0]?.col;
}

// The state round-trips through JSON the way a persisted store (Zustand persist, a backend) hands it back.
function throughJson(state: BoardsState): unknown {
  return JSON.parse(JSON.stringify(state));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('restoreBoards', () => {
  it('starts from the authored layouts when nothing was saved', () => {
    expect(restoreBoards(config, null)).toEqual(createInitialState(config));
    expect(restoreBoards(config, undefined)).toEqual(createInitialState(config));
  });

  it('starts on the breakpoint for the given width when nothing was saved', () => {
    expect(restoreBoards(config, null, { width: NARROW_WIDTH }).grid).toEqual({ cols: 2, rows: 2 });
  });

  it('restores a saved board as it was saved', () => {
    const moved = config.engine.apply(createInitialState(config), { type: OpType.Move, board: boardId('default'), tile: tileId('t-a'), to: { x: cell(3), y: cell(1) } });
    if (!moved.ok) throw new Error('fixture Move should succeed');
    expect(colOf(restoreBoards(config, throughJson(moved.value.state)))).toBe(3);
  });

  it('keeps a save made at a narrower breakpoint on its own grid', () => {
    const narrow = config.breakpoints[1]?.engine;
    if (!narrow) throw new Error('missing narrow breakpoint');
    const saved = narrow.reflow(createInitialState(config)).state;
    expect(restoreBoards(config, throughJson(saved)).grid).toEqual({ cols: 2, rows: 2 });
  });

  it('warns and starts over for a save it cannot use', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(restoreBoards(config, { version: 99, grid: { cols: 4, rows: 2 }, boards: [] })).toEqual(createInitialState(config));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('discarded the saved board'));
  });
});
