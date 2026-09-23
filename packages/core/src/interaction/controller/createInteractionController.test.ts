import { describe, expect, it, vi } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, px, OpType, RejectReason, type BoardsState, type Engine } from '../../index.js';
import { InteractionEventType } from '../events/InteractionEventType.js';
import { InteractionPhase } from '../state/InteractionPhase.js';
import { InteractionDefaults } from '../state/InteractionDefaults.js';
import type { StepContext } from '../StepContext.js';
import { createInteractionController } from './createInteractionController.js';

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
  if (!result.ok) throw new Error('fixture seed failed');
  return result.value.state;
}

function makeContext(engine: Engine, state: BoardsState): StepContext {
  return {
    engine,
    state,
    board: BOARD,
    boardRectPx: { x: px(0), y: px(0), w: px(GRID.cols * CELL_PX), h: px(GRID.rows * CELL_PX) },
    options: InteractionDefaults,
  };
}

describe('createInteractionController', () => {
  it('ignores a setContext whose fields are all unchanged, but re-previews on a real change', () => {
    const engine = makeEngine();
    const state = seed(engine);
    const ctx = makeContext(engine, state);
    const controller = createInteractionController({ context: ctx, onCommit: vi.fn(), onAnnounce: vi.fn() });
    controller.dispatch({ type: InteractionEventType.Grab, tile: tileId('t0'), at: { x: px(50), y: px(50) } });
    controller.dispatch({ type: InteractionEventType.Move, at: { x: px(150), y: px(50) } });
    const listener = vi.fn();
    controller.subscribe(listener);
    const dragging = controller.getSnapshot();

    controller.setContext({ ...ctx });
    expect(listener).not.toHaveBeenCalled();
    expect(controller.getSnapshot()).toBe(dragging);

    const moved = engine.apply(state, { type: OpType.Move, board: BOARD, tile: tileId('t0'), to: { x: cell(3), y: cell(3) } });
    if (!moved.ok) throw new Error('fixture move failed');
    controller.setContext(makeContext(engine, moved.value.state));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot()).not.toBe(dragging);
  });

  it('drives Grab -> Move -> Release through to onCommit, notifying subscribers along the way', () => {
    const engine = makeEngine();
    const ctx = makeContext(engine, seed(engine));
    const onCommit = vi.fn();
    const onAnnounce = vi.fn();
    const controller = createInteractionController({ context: ctx, onCommit, onAnnounce });
    const listener = vi.fn();
    controller.subscribe(listener);

    controller.dispatch({ type: InteractionEventType.Grab, tile: tileId('t0'), at: { x: px(50), y: px(50) } });
    expect(controller.getSnapshot().phase).toBe(InteractionPhase.Armed);

    controller.dispatch({ type: InteractionEventType.Move, at: { x: px(150), y: px(50) } });
    expect(controller.getSnapshot().phase).toBe(InteractionPhase.Dragging);

    controller.dispatch({ type: InteractionEventType.Release, at: { x: px(150), y: px(50) } });

    expect(controller.getSnapshot()).toEqual({ phase: InteractionPhase.Idle });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit.mock.calls[0]?.[0]).toMatchObject({ type: OpType.Move, to: { x: 1, y: 0 } });
    expect(onAnnounce).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('unsubscribe stops further notifications', () => {
    const engine = makeEngine();
    const controller = createInteractionController({ context: makeContext(engine, seed(engine)) });
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);

    unsubscribe();
    controller.dispatch({ type: InteractionEventType.Grab, tile: tileId('t0'), at: { x: px(50), y: px(50) } });

    expect(listener).not.toHaveBeenCalled();
  });

  it('setContext refreshes a stale preview while dragging, without a new event', () => {
    const engine = makeEngine();
    const seeded = seed(engine);
    const controller = createInteractionController({ context: makeContext(engine, seeded) });

    controller.dispatch({ type: InteractionEventType.Grab, tile: tileId('t0'), at: { x: px(50), y: px(50) } });
    controller.dispatch({ type: InteractionEventType.Move, at: { x: px(150), y: px(50) } });
    expect(controller.getSnapshot().phase).toBe(InteractionPhase.Dragging);

    const removed = engine.apply(seeded, { type: OpType.Remove, board: BOARD, tile: tileId('t0') });
    if (!removed.ok) throw new Error('fixture removal should succeed');
    controller.setContext(makeContext(engine, removed.value.state));

    const snapshot = controller.getSnapshot();
    expect(snapshot.phase).toBe(InteractionPhase.Dragging);
    if (snapshot.phase !== InteractionPhase.Dragging) return;
    expect(snapshot.preview).toEqual({ ok: false, error: { reason: RejectReason.UnknownTarget } });
  });

  it('setContext while not dragging just swaps the context, with no preview to refresh', () => {
    const engine = makeEngine();
    const controller = createInteractionController({ context: makeContext(engine, seed(engine)) });
    const listener = vi.fn();
    controller.subscribe(listener);

    controller.setContext(makeContext(engine, seed(engine)));

    expect(controller.getSnapshot()).toEqual({ phase: InteractionPhase.Idle });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('calls onReject, not onCommit, when a release is no longer valid', () => {
    const engine = makeEngine();
    const seeded = seed(engine);
    const removed = engine.apply(seeded, { type: OpType.Remove, board: BOARD, tile: tileId('t0') });
    if (!removed.ok) throw new Error('fixture removal should succeed');
    const onCommit = vi.fn();
    const onReject = vi.fn();
    const controller = createInteractionController({ context: makeContext(engine, seeded), onCommit, onReject });

    controller.dispatch({ type: InteractionEventType.Grab, tile: tileId('t0'), at: { x: px(50), y: px(50) } });
    controller.dispatch({ type: InteractionEventType.Move, at: { x: px(150), y: px(50) } });
    // The tile is removed out from under the controller before the drop, via a fresh context.
    controller.setContext(makeContext(engine, removed.value.state));
    controller.dispatch({ type: InteractionEventType.Release, at: { x: px(150), y: px(50) } });

    expect(onCommit).not.toHaveBeenCalled();
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('tracks the dragged tile\'s continuous position on a separate pointer store', () => {
    const engine = makeEngine();
    const controller = createInteractionController({ context: makeContext(engine, seed(engine)) });
    const pointerListener = vi.fn();
    controller.subscribePointer(pointerListener);

    expect(controller.getPointerSnapshot()).toBeNull();
    controller.dispatch({ type: InteractionEventType.Grab, tile: tileId('t0'), at: { x: px(50), y: px(50) } });
    controller.dispatch({ type: InteractionEventType.Move, at: { x: px(150), y: px(50) } });

    expect(pointerListener).toHaveBeenCalled();
    expect(controller.getPointerSnapshot()).toEqual({ tile: tileId('t0'), origin: { x: 1, y: 0 } });

    controller.dispatch({ type: InteractionEventType.Release, at: { x: px(150), y: px(50) } });
    expect(controller.getPointerSnapshot()).toBeNull();
  });
});
