import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, hideTiles, withSavedLayout, type BoardsState, type Engine } from '../index.js';

const catalog = { w: { sizes: [{ w: cell(1), h: cell(1) }] } };
const wide = createEngine({ grid: { cols: 4, rows: 1 }, catalog });
const narrow = createEngine({ grid: { cols: 2, rows: 2 }, catalog });
const T0 = tileId('t0');
const T1 = tileId('t1');

function twoTiles(engine: Engine): BoardsState {
  let state = engine.empty();
  for (const [index, tile] of [T0, T1].entries()) {
    const added = engine.apply(state, {
      type: OpType.Add,
      board: boardId('default'),
      tileId: tile,
      widget: { id: widgetId(`w${index}`), type: 'w' },
      size: { w: cell(1), h: cell(1) },
      at: { x: cell(index), y: cell(0) },
    });
    if (!added.ok) throw new Error('fixture add should succeed');
    state = added.value.state;
  }
  return state;
}

function shownIds(state: BoardsState): readonly string[] {
  return state.boards.flatMap((board) => board.tiles.map((tile) => tile.id));
}

describe('hideTiles', () => {
  it('parks the tiles on the current grid and keeps the rest', () => {
    const hidden = hideTiles(twoTiles(wide), new Set([T1]));
    expect(shownIds(hidden)).toEqual([T0]);
    expect(hidden.parked.map((tile) => tile.id)).toEqual([T1]);
    expect(engineValid(hidden)).toBe(true);
  });

  it('keeps a tile hidden on a grid whose saved layout hides it, and shows it everywhere else', () => {
    const base = twoTiles(wide);
    const state = withSavedLayout(base, hideTiles(twoTiles(narrow), new Set([T1])));
    const onNarrow = narrow.reflow(state).state;
    expect(shownIds(onNarrow)).toEqual([T0]);
    const backOnWide = wide.reflow(onNarrow).state;
    expect(shownIds(backOnWide).sort()).toEqual([T0, T1]);
    expect(shownIds(narrow.reflow(backOnWide).state)).toEqual([T0]);
  });

  it('round-trips a hidden entry through serialize and parse', () => {
    const state = withSavedLayout(twoTiles(wide), hideTiles(twoTiles(narrow), new Set([T1])));
    const parsed = wide.parse(JSON.parse(JSON.stringify(wide.serialize(state))));
    expect(parsed.ok && parsed.value.layouts['2x2']?.find((entry) => entry.tile === T1)?.hidden).toBe(true);
  });
});

function engineValid(state: BoardsState): boolean {
  return wide.parse(JSON.parse(JSON.stringify(state))).ok;
}
