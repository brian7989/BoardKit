import { describe, expect, it } from 'vitest';
import { OpType, RejectReason, tileId, widgetId, type RenameWidgetOp } from '../../packages/core/src/index.ts';
import { DEFAULT_BOARD, makeTestEngine, rawState } from '../property/fixtures.ts';

describe('renameWidget (golden fixtures)', () => {
  it('sets a custom displayName on the item', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: RenameWidgetOp = { type: OpType.RenameWidget, board: DEFAULT_BOARD, tile: tileId('t0'), widget: widgetId('t0-widget'), name: 'Steps' };
    const result = engine.apply(parsed.value, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.boards[0]?.tiles[0]?.items[0]).toMatchObject({ displayName: 'Steps' });
  });

  it('trims whitespace around the name', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: RenameWidgetOp = { type: OpType.RenameWidget, board: DEFAULT_BOARD, tile: tileId('t0'), widget: widgetId('t0-widget'), name: '  Steps  ' };
    const result = engine.apply(parsed.value, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.boards[0]?.tiles[0]?.items[0]).toMatchObject({ displayName: 'Steps' });
  });

  it('an empty (or all-whitespace) name clears a previous displayName entirely', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');
    const named = engine.apply(parsed.value, {
      type: OpType.RenameWidget,
      board: DEFAULT_BOARD,
      tile: tileId('t0'),
      widget: widgetId('t0-widget'),
      name: 'Steps',
    });
    if (!named.ok) throw new Error('fixture rename should succeed');

    const op: RenameWidgetOp = { type: OpType.RenameWidget, board: DEFAULT_BOARD, tile: tileId('t0'), widget: widgetId('t0-widget'), name: '   ' };
    const result = engine.apply(named.value.state, op);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state.boards[0]?.tiles[0]?.items[0]).not.toHaveProperty('displayName');
  });

  it('rejects renaming an unknown widget', () => {
    const engine = makeTestEngine();
    const parsed = engine.parse(rawState([{ id: 't0', col: 0, row: 0 }]));
    if (!parsed.ok) throw new Error('fixture should parse');

    const op: RenameWidgetOp = { type: OpType.RenameWidget, board: DEFAULT_BOARD, tile: tileId('t0'), widget: widgetId('does-not-exist'), name: 'Steps' };
    const result = engine.apply(parsed.value, op);
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.UnknownTarget } });
  });
});
