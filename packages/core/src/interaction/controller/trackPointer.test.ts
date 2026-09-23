import { describe, expect, it } from 'vitest';
import { trackPointer } from './trackPointer.js';
import { createEngine, boardId, tileId, widgetId, cell, px, OpType, type BoardsState, type Engine } from '../../index.js';
import { InteractionPhase } from '../state/InteractionPhase.js';
import { InteractionEventType } from '../events/InteractionEventType.js';
import type { StepContext } from '../StepContext.js';

const GRID = { cols: 4, rows: 4 };
const BOARD = boardId('default');
const WIDGET_TYPE = 'demo.widget';
const SIZE_SMALL = { w: cell(1), h: cell(1) };
const CELL_PX = 100;

function makeEngine(): Engine {
  return createEngine({ grid: GRID, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL] } } });
}

function seed(engine: Engine): BoardsState {
  const result = engine.apply(engine.empty(), {
    type: OpType.Add,
    board: BOARD,
    tileId: tileId('t0'),
    widget: { id: widgetId('w0'), type: WIDGET_TYPE },
    size: SIZE_SMALL,
    at: { x: cell(0), y: cell(0) },
  });
  if (!result.ok) throw new Error('fixture add should succeed');
  return result.value.state;
}

function makeContext(engine: Engine, state: BoardsState): StepContext {
  return {
    engine,
    state,
    board: BOARD,
    boardRectPx: { x: px(0), y: px(0), w: px(GRID.cols * CELL_PX), h: px(GRID.rows * CELL_PX) },
    options: { dragThresholdPx: 4, hysteresisFraction: 0.3 },
  };
}

function dragging(engine: Engine, state: BoardsState) {
  return {
    phase: InteractionPhase.Dragging,
    tile: tileId('t0'),
    grabOffset: { x: px(0), y: px(0) },
    target: { x: cell(0), y: cell(0) },
    preview: engine.apply(state, { type: OpType.Move, board: BOARD, tile: tileId('t0'), to: { x: cell(0), y: cell(0) } }),
  } as const;
}

describe('trackPointer', () => {
  it('returns null when not dragging', () => {
    const engine = makeEngine();
    const ctx = makeContext(engine, seed(engine));
    expect(trackPointer(ctx, { phase: InteractionPhase.Idle }, { type: InteractionEventType.Move, at: { x: px(50), y: px(50) } })).toBeNull();
  });

  it('returns null for a non-Move event while dragging', () => {
    const engine = makeEngine();
    const seeded = seed(engine);
    const ctx = makeContext(engine, seeded);
    expect(trackPointer(ctx, dragging(engine, seeded), { type: InteractionEventType.Cancel })).toBeNull();
  });

  it('returns null once the dragged tile no longer exists in ctx.state', () => {
    const engine = makeEngine();
    const seeded = seed(engine);
    const removed = engine.apply(seeded, { type: OpType.Remove, board: BOARD, tile: tileId('t0') });
    if (!removed.ok) throw new Error('fixture removal should succeed');
    const ctx = makeContext(engine, removed.value.state);

    expect(trackPointer(ctx, dragging(engine, seeded), { type: InteractionEventType.Move, at: { x: px(50), y: px(50) } })).toBeNull();
  });

  it('reports the dragged tile\'s continuous fractional origin while dragging', () => {
    const engine = makeEngine();
    const seeded = seed(engine);
    const ctx = makeContext(engine, seeded);
    const snapshot = trackPointer(ctx, dragging(engine, seeded), { type: InteractionEventType.Move, at: { x: px(150), y: px(50) } });
    expect(snapshot).toEqual({ tile: tileId('t0'), origin: { x: 1.5, y: 0.5 } });
  });
});
