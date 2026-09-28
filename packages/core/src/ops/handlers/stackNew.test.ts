import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, RejectReason, ChangeKind } from '../../index.js';

const BOARD = boardId('default');
const SMALL = { w: cell(1), h: cell(1) };
const engine = createEngine({ grid: { cols: 1, rows: 1 }, catalog: { a: { sizes: [SMALL] }, b: { sizes: [SMALL] }, wide: { sizes: [{ w: cell(2), h: cell(1) }] } } });

// A full 1x1 board: there is no free grid space left anywhere.
function fullBoard() {
  const added = engine.apply(engine.empty(), { type: OpType.Add, board: BOARD, tileId: tileId('t0'), widget: { id: widgetId('w0'), type: 'a' }, size: SMALL });
  if (!added.ok) throw new Error('fixture add should succeed');
  return added.value.state;
}

describe('stackNew', () => {
  it('stacks a new widget onto the tile and shows it, even on a full board', () => {
    const result = engine.apply(fullBoard(), { type: OpType.StackNew, board: BOARD, onto: tileId('t0'), widget: { id: widgetId('w1'), type: 'b' } });
    const tile = result.ok ? result.value.state.boards[0]?.tiles[0] : undefined;
    expect(tile?.items.map((item) => item.id)).toEqual([widgetId('w0'), widgetId('w1')]);
    expect(tile?.active).toBe(1);
    expect(result.ok && result.value.changes[0]?.kind).toBe(ChangeKind.Stacked);
  });

  it('rejects SizeNotAllowed when the widget cannot take the tile size, and UnknownTarget for a missing tile', () => {
    const wrongSize = engine.apply(fullBoard(), { type: OpType.StackNew, board: BOARD, onto: tileId('t0'), widget: { id: widgetId('w1'), type: 'wide' } });
    const missing = engine.apply(fullBoard(), { type: OpType.StackNew, board: BOARD, onto: tileId('nope'), widget: { id: widgetId('w1'), type: 'b' } });
    expect(wrongSize.ok ? null : wrongSize.error.reason).toBe(RejectReason.SizeNotAllowed);
    expect(missing.ok ? null : missing.error.reason).toBe(RejectReason.UnknownTarget);
  });
});
