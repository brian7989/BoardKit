import { describe, expect, it } from 'vitest';
import { isFloating } from 'boardkit-core';
import { defineWidget } from '../../widget/index.js';
import { defineBoards } from './defineBoards.js';
import { createInitialState } from './createInitialState.js';
import type { InitialLayoutTile } from './InitialLayoutTile.js';

const small = defineWidget({ type: 'small', title: 'Small', sizes: ['1x1'], component: () => null });
const big = defineWidget({ type: 'big', title: 'Big', sizes: ['1x1', '2x2'], component: () => null });

function stateFor(initialLayout: readonly InitialLayoutTile[]) {
  return createInitialState(defineBoards({ grid: { cols: 2, rows: 2 }, widgets: [small, big], initialLayout }));
}

describe('createInitialState', () => {
  it('first-fits at the largest fitting size and spills onto new pages', () => {
    const state = stateFor([{ widget: 'big' }, { widget: 'small' }]);
    expect(state.boards).toHaveLength(2);
    expect(state.boards[0]?.tiles[0]?.size).toEqual({ w: 2, h: 2 });
    expect(state.boards[1]?.tiles).toHaveLength(1);
  });

  it('places page entries on extra pages after the automatic ones, at their cell', () => {
    const state = stateFor([{ widget: 'small' }, { widget: 'small', page: 0, at: [1, 1], name: 'Pinned', props: { a: 1 } }]);
    const pinned = state.boards[1]?.tiles[0];
    expect(state.boards).toHaveLength(2);
    expect(pinned).toMatchObject({ col: 1, row: 1 });
    expect(pinned?.items[0]).toMatchObject({ displayName: 'Pinned', props: { a: 1 } });
  });

  it('finds free space on a page when no cell is given, and drops entries once it is full', () => {
    const entries = Array.from({ length: 5 }, (): InitialLayoutTile => ({ widget: 'small', page: 0 }));
    expect(stateFor(entries).boards[1]?.tiles).toHaveLength(4);
  });

  it('adds floating entries without taking grid space', () => {
    const state = stateFor([{ widget: 'big', size: '2x2' }, { widget: 'small', page: 0, float: { x: 0.5, y: 0.5 } }]);
    const floating = state.boards[1]?.tiles[0];
    expect(floating && isFloating(floating)).toBe(true);
  });

  it('skips entries whose widget type is not registered', () => {
    expect(stateFor([{ widget: 'nope' }, { widget: 'nope', page: 0 }]).boards[0]?.tiles).toHaveLength(0);
  });
});
