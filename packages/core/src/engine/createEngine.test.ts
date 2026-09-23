import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, RejectReason } from '../index.js';
import { Direction } from '../solver/index.js';

describe('createEngine', () => {
  it('defaults cellAspect to 1 when not given', () => {
    const engine = createEngine({ grid: { cols: 2, rows: 2 }, catalog: {} });
    expect(engine.empty().grid).toEqual({ cols: 2, rows: 2 });
  });

  it('serializes a state as the identity function and checks it as valid', () => {
    const engine = createEngine({ grid: { cols: 2, rows: 2 }, catalog: {} });
    const state = engine.empty();
    expect(engine.serialize(state)).toBe(state);
    expect(engine.check(state)).toEqual([]);
  });

  it('repairs a state through the engine the same way the standalone function does', () => {
    const engine = createEngine({ grid: { cols: 2, rows: 2 }, catalog: {} });
    const result = engine.repair(engine.empty());
    expect(result).toEqual({ ok: true, value: { state: engine.empty(), relocated: [], dropped: [] } });
  });

  it('accepts an explicit cellAspect', () => {
    const engine = createEngine({ grid: { cols: 2, rows: 2, cellAspect: 1.5 }, catalog: {} });
    expect(engine.empty()).toBeTruthy();
  });

  it('defaults every solver option when none are given', () => {
    const engine = createEngine({ grid: { cols: 4, rows: 4 }, catalog: { w: { sizes: [{ w: cell(1), h: cell(1) }] } } });
    // With no explicit maxNodes, the SolverDefaults value (20,000) applies — plenty for this.
    const added = engine.apply(engine.empty(), {
      type: OpType.Add,
      board: boardId('default'),
      tileId: tileId('t0'),
      widget: { id: widgetId('w0'), type: 'w' },
      size: { w: cell(1), h: cell(1) },
    });
    expect(added.ok).toBe(true);
  });

  it('honors explicit solver options over the defaults', () => {
    const engine = createEngine({
      grid: { cols: 4, rows: 4 },
      catalog: { w: { sizes: [{ w: cell(1), h: cell(1) }] } },
      solver: { maxNodes: 1, directions: [Direction.Up], nudgeOnResize: false },
    });
    // A full board move that would need a chain of relocations exhausts a budget of 1 node.
    let state = engine.empty();
    for (let index = 0; index < 16; index += 1) {
      const result = engine.apply(state, {
        type: OpType.Add,
        board: boardId('default'),
        tileId: tileId(`t${index}`),
        widget: { id: widgetId(`w${index}`), type: 'w' },
        size: { w: cell(1), h: cell(1) },
        at: { x: cell(index % 4), y: cell(Math.floor(index / 4)) },
      });
      if (!result.ok) throw new Error('fixture fill should succeed');
      state = result.value.state;
    }
    const result = engine.apply(state, { type: OpType.Move, board: boardId('default'), tile: tileId('t0'), to: { x: cell(1), y: cell(0) } });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.NoValidArrangement, blockedBy: [tileId('t1')] } });
  });
});
