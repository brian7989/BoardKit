import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType } from '../index.js';

const GRID = { cols: 4, rows: 4 };
const BOARD = boardId('default');
const WIDGET_TYPE = 'demo.widget';
const SIZE_SMALL = { w: cell(1), h: cell(1) };

function makeEngine() {
  return createEngine({ grid: GRID, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL] } } });
}

describe('engine.findFree', () => {
  it('returns null for a board that does not exist', () => {
    const engine = makeEngine();
    expect(engine.findFree(engine.empty(), boardId('nope'), SIZE_SMALL)).toBeNull();
  });

  it('returns the first free cell, row-major', () => {
    const engine = makeEngine();
    const added = engine.apply(engine.empty(), {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('t0'),
      widget: { id: widgetId('w0'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      at: { x: cell(0), y: cell(0) },
    });
    if (!added.ok) throw new Error('fixture add should succeed');
    expect(engine.findFree(added.value.state, BOARD, SIZE_SMALL)).toEqual({ x: 1, y: 0 });
  });

  it('returns null once the board is completely full', () => {
    const engine = makeEngine();
    let state = engine.empty();
    for (let index = 0; index < GRID.cols * GRID.rows; index += 1) {
      const result = engine.apply(state, {
        type: OpType.Add,
        board: BOARD,
        tileId: tileId(`t${index}`),
        widget: { id: widgetId(`w${index}`), type: WIDGET_TYPE },
        size: SIZE_SMALL,
      });
      if (!result.ok) throw new Error('fixture fill should succeed');
      state = result.value.state;
    }
    expect(engine.findFree(state, BOARD, SIZE_SMALL)).toBeNull();
  });

  it('ignores a floating tile\'s stale grid position as an obstacle', () => {
    const engine = makeEngine();
    const added = engine.apply(engine.empty(), {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('t0'),
      widget: { id: widgetId('w0'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      at: { x: cell(0), y: cell(0) },
    });
    if (!added.ok) throw new Error('fixture add should succeed');
    const floated = engine.apply(added.value.state, { type: OpType.SetFloating, board: BOARD, tile: tileId('t0'), floating: true });
    if (!floated.ok) throw new Error('fixture float should succeed');

    expect(engine.findFree(floated.value.state, BOARD, SIZE_SMALL)).toEqual({ x: 0, y: 0 });
  });
});
