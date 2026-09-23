import { describe, expect, it } from 'vitest';
import { OpType, RejectReason, boardId, tileId, widgetId, type AddOp, type RemoveOp, type ResizeOp } from '../../packages/core/src/index.ts';
import { DEFAULT_BOARD, SIZE_HUGE, SIZE_SMALL, WIDGET_TYPE, makeTestEngine, rawState } from '../property/fixtures.ts';

describe('state + op -> expected Result (golden fixtures)', () => {
  it('adds a widget into the first free cell, row-major', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: AddOp = { type: OpType.Add, board: DEFAULT_BOARD, tileId: tileId('t1'), widget: { id: widgetId('w1'), type: WIDGET_TYPE }, size: SIZE_SMALL };
    const result = engine.apply(parsed.value, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const added = result.value.state.boards[0]?.tiles.find((tile) => tile.id === 't1');
    expect(added).toMatchObject({ col: 1, row: 0 });
  });

  it('rejects an add when the board is completely full', () => {
    const engine = makeTestEngine();
    const tiles = Array.from({ length: 16 }, (_, index) => ({ id: `t${index}`, col: index % 4, row: Math.floor(index / 4) }));
    const parsed = engine.parse(rawState(tiles));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: AddOp = { type: OpType.Add, board: DEFAULT_BOARD, tileId: tileId('overflow'), widget: { id: widgetId('w-overflow'), type: WIDGET_TYPE }, size: SIZE_SMALL };
    const result = engine.apply(parsed.value, op);
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.NoFreeSpace } });
  });

  it('rejects a resize that would leave the board', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 3, row: 3 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: ResizeOp = { type: OpType.Resize, board: DEFAULT_BOARD, tile: tileId('t0'), size: SIZE_HUGE };
    const result = engine.apply(parsed.value, op);
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.OutOfBounds } });
  });

  it('removes a tile entirely', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }, { id: 't1', col: 1, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: RemoveOp = { type: OpType.Remove, board: DEFAULT_BOARD, tile: tileId('t0') };
    const result = engine.apply(parsed.value, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.boards[0]?.tiles.map((tile) => tile.id)).toEqual(['t1']);
  });

  it('rejects an op targeting an unknown tile', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: RemoveOp = { type: OpType.Remove, board: boardId('default'), tile: tileId('does-not-exist') };
    const result = engine.apply(parsed.value, op);
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.UnknownTarget } });
  });
});
