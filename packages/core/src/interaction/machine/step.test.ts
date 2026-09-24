import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, px, OpType, RejectReason, type BoardsState, type Engine } from '../../index.js';
import { InteractionEventType } from '../events/InteractionEventType.js';
import { EffectType } from '../events/EffectType.js';
import { AnnouncementKey } from '../events/AnnouncementKey.js';
import { InteractionPhase } from '../state/InteractionPhase.js';
import { InteractionDefaults } from '../state/InteractionDefaults.js';
import type { StepContext } from '../StepContext.js';
import { step } from './step.js';

const GRID = { cols: 4, rows: 4 };
const BOARD = boardId('default');
const WIDGET_TYPE = 'demo.widget';
const SIZE_SMALL = { w: cell(1), h: cell(1) };
const CELL_PX = 100;

function makeEngine(): Engine {
  return createEngine({ grid: GRID, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL] } } });
}

function seed(engine: Engine, tiles: readonly { readonly id: string; readonly col: number; readonly row: number }[]): BoardsState {
  return tiles.reduce((state, tile) => {
    const result = engine.apply(state, {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId(tile.id),
      widget: { id: widgetId(`${tile.id}-w`), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      at: { x: cell(tile.col), y: cell(tile.row) },
    });
    if (!result.ok) throw new Error('fixture seed failed');
    return result.value.state;
  }, engine.empty());
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

describe('step: pointer dragging', () => {
  it('Idle + Grab -> Armed, with a grab offset relative to the tile origin', () => {
    const engine = makeEngine();
    const ctx = makeContext(engine, seed(engine, [{ id: 't0', col: 0, row: 0 }]));

    const result = step(ctx, { phase: InteractionPhase.Idle }, {
      type: InteractionEventType.Grab,
      tile: tileId('t0'),
      at: { x: px(50), y: px(50) },
    });

    expect(result.state).toEqual({
      phase: InteractionPhase.Armed,
      tile: tileId('t0'),
      origin: { x: px(50), y: px(50) },
      grabOffset: { x: px(50), y: px(50) },
    });
    expect(result.effects).toEqual([]);
  });

  it('Armed + Move below the drag threshold stays Armed (a tap in progress)', () => {
    const engine = makeEngine();
    const ctx = makeContext(engine, seed(engine, [{ id: 't0', col: 0, row: 0 }]));
    const armed = {
      phase: InteractionPhase.Armed,
      tile: tileId('t0'),
      origin: { x: px(50), y: px(50) },
      grabOffset: { x: px(50), y: px(50) },
    } as const;

    const result = step(ctx, armed, { type: InteractionEventType.Move, at: { x: px(52), y: px(52) } });

    expect(result.state).toBe(armed);
    expect(result.effects).toEqual([]);
  });

  it('Armed + Release before the threshold returns to Idle (a tap)', () => {
    const engine = makeEngine();
    const ctx = makeContext(engine, seed(engine, [{ id: 't0', col: 0, row: 0 }]));
    const armed = {
      phase: InteractionPhase.Armed,
      tile: tileId('t0'),
      origin: { x: px(50), y: px(50) },
      grabOffset: { x: px(50), y: px(50) },
    } as const;

    const result = step(ctx, armed, { type: InteractionEventType.Release, at: { x: px(50), y: px(50) } });

    expect(result.state).toEqual({ phase: InteractionPhase.Idle });
    expect(result.effects).toEqual([]);
  });

  it('Armed + Move past the threshold crosses into Dragging with a valid preview', () => {
    const engine = makeEngine();
    const ctx = makeContext(engine, seed(engine, [{ id: 't0', col: 0, row: 0 }]));
    const armed = {
      phase: InteractionPhase.Armed,
      tile: tileId('t0'),
      origin: { x: px(50), y: px(50) },
      grabOffset: { x: px(50), y: px(50) },
    } as const;

    const result = step(ctx, armed, { type: InteractionEventType.Move, at: { x: px(60), y: px(50) } });

    expect(result.state.phase).toBe(InteractionPhase.Dragging);
    if (result.state.phase !== InteractionPhase.Dragging) return;
    expect(result.state.target).toEqual({ x: cell(0), y: cell(0) });
    expect(result.state.preview.ok).toBe(true);
  });

  it('Dragging + Move retargets once the pointer passes the hysteresis boundary', () => {
    const engine = makeEngine();
    const ctx = makeContext(engine, seed(engine, [{ id: 't0', col: 0, row: 0 }]));
    const dragging = {
      phase: InteractionPhase.Dragging,
      tile: tileId('t0'),
      grabOffset: { x: px(50), y: px(50) },
      target: { x: cell(0), y: cell(0) },
      preview: engine.apply(ctx.state, { type: OpType.Move, board: BOARD, tile: tileId('t0'), to: { x: cell(0), y: cell(0) } }),
    } as const;

    const result = step(ctx, dragging, { type: InteractionEventType.Move, at: { x: px(150), y: px(50) } });

    expect(result.state.phase).toBe(InteractionPhase.Dragging);
    if (result.state.phase !== InteractionPhase.Dragging) return;
    expect(result.state.target).toEqual({ x: cell(1), y: cell(0) });
    expect(result.effects).toEqual([{ type: EffectType.Announce, key: AnnouncementKey.Moved, params: {} }]);
  });

  it('Dragging + Release inside the board commits the move', () => {
    const engine = makeEngine();
    const ctx = makeContext(engine, seed(engine, [{ id: 't0', col: 0, row: 0 }]));
    const dragging = {
      phase: InteractionPhase.Dragging,
      tile: tileId('t0'),
      grabOffset: { x: px(50), y: px(50) },
      target: { x: cell(1), y: cell(0) },
      preview: engine.apply(ctx.state, { type: OpType.Move, board: BOARD, tile: tileId('t0'), to: { x: cell(1), y: cell(0) } }),
    } as const;

    const result = step(ctx, dragging, { type: InteractionEventType.Release, at: { x: px(150), y: px(50) } });

    expect(result.state).toEqual({ phase: InteractionPhase.Idle });
    expect(result.effects[0]).toMatchObject({ type: EffectType.Commit, op: { type: OpType.Move, tile: tileId('t0'), to: { x: 1, y: 0 } } });
    expect(result.effects[1]).toEqual({ type: EffectType.Announce, key: AnnouncementKey.Dropped, params: {} });
  });

  it('Dragging + Release rejects without committing when the op is no longer valid', () => {
    const engine = makeEngine();
    const seeded = seed(engine, [{ id: 't0', col: 0, row: 0 }]);
    const removed = engine.apply(seeded, { type: OpType.Remove, board: BOARD, tile: tileId('t0') });
    if (!removed.ok) throw new Error('fixture removal should succeed');
    const ctx = makeContext(engine, removed.value.state);
    const dragging = {
      phase: InteractionPhase.Dragging,
      tile: tileId('t0'),
      grabOffset: { x: px(50), y: px(50) },
      target: { x: cell(1), y: cell(0) },
      preview: { ok: false, error: { reason: RejectReason.UnknownTarget } },
    } as const;

    const result = step(ctx, dragging, { type: InteractionEventType.Release, at: { x: px(150), y: px(50) } });

    expect(result.state).toEqual({ phase: InteractionPhase.Idle });
    expect(result.effects[0]?.type).toBe(EffectType.Reject);
    expect(result.effects[1]).toEqual({ type: EffectType.Announce, key: AnnouncementKey.Rejected, params: {} });
  });

  it('Dragging + Release outside the board cancels rather than dropping', () => {
    const engine = makeEngine();
    const ctx = makeContext(engine, seed(engine, [{ id: 't0', col: 0, row: 0 }]));
    const dragging = {
      phase: InteractionPhase.Dragging,
      tile: tileId('t0'),
      grabOffset: { x: px(50), y: px(50) },
      target: { x: cell(1), y: cell(0) },
      preview: engine.apply(ctx.state, { type: OpType.Move, board: BOARD, tile: tileId('t0'), to: { x: cell(1), y: cell(0) } }),
    } as const;

    const result = step(ctx, dragging, { type: InteractionEventType.Release, at: { x: px(-10), y: px(50) } });

    expect(result.state).toEqual({ phase: InteractionPhase.Idle });
    expect(result.effects).toEqual([{ type: EffectType.Announce, key: AnnouncementKey.Cancelled, params: {} }]);
  });

  it('Cancel during Dragging returns to Idle with no commit', () => {
    const engine = makeEngine();
    const ctx = makeContext(engine, seed(engine, [{ id: 't0', col: 0, row: 0 }]));
    const dragging = {
      phase: InteractionPhase.Dragging,
      tile: tileId('t0'),
      grabOffset: { x: px(50), y: px(50) },
      target: { x: cell(1), y: cell(0) },
      preview: engine.apply(ctx.state, { type: OpType.Move, board: BOARD, tile: tileId('t0'), to: { x: cell(1), y: cell(0) } }),
    } as const;

    const result = step(ctx, dragging, { type: InteractionEventType.Cancel });

    expect(result.state).toEqual({ phase: InteractionPhase.Idle });
    expect(result.effects).toEqual([{ type: EffectType.Announce, key: AnnouncementKey.Cancelled, params: {} }]);
  });
});

describe('step: events a phase does not react to', () => {
  it('Idle ignores Move, Release, and Cancel', () => {
    const engine = makeEngine();
    const ctx = makeContext(engine, seed(engine, [{ id: 't0', col: 0, row: 0 }]));
    const idle = { phase: InteractionPhase.Idle } as const;

    for (const event of [
      { type: InteractionEventType.Move, at: { x: px(50), y: px(50) } },
      { type: InteractionEventType.Release, at: { x: px(50), y: px(50) } },
      { type: InteractionEventType.Cancel },
    ] as const) {
      const result = step(ctx, idle, event);
      expect(result).toEqual({ state: idle, effects: [] });
    }
  });

  it('Idle + Grab on a tile that no longer exists stays Idle', () => {
    const engine = makeEngine();
    const ctx = makeContext(engine, seed(engine, [{ id: 't0', col: 0, row: 0 }]));

    const result = step(ctx, { phase: InteractionPhase.Idle }, { type: InteractionEventType.Grab, tile: tileId('missing'), at: { x: px(0), y: px(0) } });

    expect(result).toEqual({ state: { phase: InteractionPhase.Idle }, effects: [] });
  });

  it('Armed ignores a second Grab', () => {
    const engine = makeEngine();
    const ctx = makeContext(engine, seed(engine, [{ id: 't0', col: 0, row: 0 }]));
    const armed = {
      phase: InteractionPhase.Armed,
      tile: tileId('t0'),
      origin: { x: px(50), y: px(50) },
      grabOffset: { x: px(50), y: px(50) },
    } as const;

    const result = step(ctx, armed, { type: InteractionEventType.Grab, tile: tileId('t0'), at: { x: px(50), y: px(50) } });

    expect(result).toEqual({ state: armed, effects: [] });
  });

  it('Armed + Cancel returns to Idle with an announcement', () => {
    const engine = makeEngine();
    const ctx = makeContext(engine, seed(engine, [{ id: 't0', col: 0, row: 0 }]));
    const armed = {
      phase: InteractionPhase.Armed,
      tile: tileId('t0'),
      origin: { x: px(50), y: px(50) },
      grabOffset: { x: px(50), y: px(50) },
    } as const;

    const result = step(ctx, armed, { type: InteractionEventType.Cancel });

    expect(result).toEqual({
      state: { phase: InteractionPhase.Idle },
      effects: [{ type: EffectType.Announce, key: AnnouncementKey.Cancelled, params: {} }],
    });
  });

  it('Armed + Move past the threshold cancels, rather than dragging, once the tile has vanished', () => {
    const engine = makeEngine();
    const seeded = seed(engine, [{ id: 't0', col: 0, row: 0 }]);
    const removed = engine.apply(seeded, { type: OpType.Remove, board: BOARD, tile: tileId('t0') });
    if (!removed.ok) throw new Error('fixture removal should succeed');
    const ctx = makeContext(engine, removed.value.state);
    const armed = {
      phase: InteractionPhase.Armed,
      tile: tileId('t0'),
      origin: { x: px(50), y: px(50) },
      grabOffset: { x: px(50), y: px(50) },
    } as const;

    const result = step(ctx, armed, { type: InteractionEventType.Move, at: { x: px(60), y: px(50) } });

    expect(result).toEqual({
      state: { phase: InteractionPhase.Idle },
      effects: [{ type: EffectType.Announce, key: AnnouncementKey.Cancelled, params: {} }],
    });
  });

  it('Dragging ignores a Grab', () => {
    const engine = makeEngine();
    const ctx = makeContext(engine, seed(engine, [{ id: 't0', col: 0, row: 0 }]));
    const dragging = {
      phase: InteractionPhase.Dragging,
      tile: tileId('t0'),
      grabOffset: { x: px(50), y: px(50) },
      target: { x: cell(0), y: cell(0) },
      preview: engine.apply(ctx.state, { type: OpType.Move, board: BOARD, tile: tileId('t0'), to: { x: cell(0), y: cell(0) } }),
    } as const;

    const result = step(ctx, dragging, { type: InteractionEventType.Grab, tile: tileId('t0'), at: { x: px(0), y: px(0) } });

    expect(result).toEqual({ state: dragging, effects: [] });
  });

  it('Dragging + Move cancels once the dragged tile has vanished from the committed state', () => {
    const engine = makeEngine();
    const seeded = seed(engine, [{ id: 't0', col: 0, row: 0 }]);
    const dragging = {
      phase: InteractionPhase.Dragging,
      tile: tileId('t0'),
      grabOffset: { x: px(50), y: px(50) },
      target: { x: cell(0), y: cell(0) },
      preview: engine.apply(seeded, { type: OpType.Move, board: BOARD, tile: tileId('t0'), to: { x: cell(0), y: cell(0) } }),
    } as const;
    const removed = engine.apply(seeded, { type: OpType.Remove, board: BOARD, tile: tileId('t0') });
    if (!removed.ok) throw new Error('fixture removal should succeed');
    const ctx = makeContext(engine, removed.value.state);

    const result = step(ctx, dragging, { type: InteractionEventType.Move, at: { x: px(60), y: px(50) } });

    expect(result).toEqual({
      state: { phase: InteractionPhase.Idle },
      effects: [{ type: EffectType.Announce, key: AnnouncementKey.Cancelled, params: {} }],
    });
  });
});

describe('step: dragging a snapped floating tile', () => {
  function seedFloating(engine: Engine): BoardsState {
    const result = engine.apply(engine.empty(), {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('f0'),
      widget: { id: widgetId('f0-w'), type: WIDGET_TYPE },
      size: SIZE_SMALL,
      float: { x: 2, y: 1 },
    });
    if (!result.ok) throw new Error('fixture seed failed');
    return result.value.state;
  }

  it('grabs relative to the float position, previews and commits a MoveFloating', () => {
    const engine = makeEngine();
    const ctx = makeContext(engine, seedFloating(engine));

    const armed = step(ctx, { phase: InteractionPhase.Idle }, { type: InteractionEventType.Grab, tile: tileId('f0'), at: { x: px(250), y: px(150) } });
    expect(armed.state).toMatchObject({ phase: InteractionPhase.Armed, grabOffset: { x: 50, y: 50 } });

    const dragging = step(ctx, armed.state, { type: InteractionEventType.Move, at: { x: px(350), y: px(150) } });
    expect(dragging.state).toMatchObject({ phase: InteractionPhase.Dragging, target: { x: 3, y: 1 }, preview: { ok: true } });

    const released = step(ctx, dragging.state, { type: InteractionEventType.Release, at: { x: px(350), y: px(150) } });
    expect(released.effects[0]).toMatchObject({ type: EffectType.Commit, op: { type: OpType.MoveFloating, tile: tileId('f0'), to: { x: 3, y: 1 } } });
  });
});
