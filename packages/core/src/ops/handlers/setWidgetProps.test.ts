import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, RejectReason, ChangeKind } from '../../index.js';

const BOARD = boardId('default');
const engine = createEngine({ grid: { cols: 2, rows: 2 }, catalog: { w: { sizes: [{ w: cell(1), h: cell(1) }] } } });

function seeded() {
  const added = engine.apply(engine.empty(), {
    type: OpType.Add,
    board: BOARD,
    tileId: tileId('t0'),
    widget: { id: widgetId('w0'), type: 'w', props: { view: 'table', city: 'Tokyo' } },
    size: { w: cell(1), h: cell(1) },
  });
  if (!added.ok) throw new Error('fixture add should succeed');
  return added.value.state;
}

describe('setWidgetProps', () => {
  it('shallow-merges the patch into the widget props and reports PropsChanged', () => {
    const result = engine.apply(seeded(), { type: OpType.SetWidgetProps, board: BOARD, tile: tileId('t0'), widget: widgetId('w0'), props: { view: 'cards' } });
    expect(result.ok && result.value.state.boards[0]?.tiles[0]?.items[0]?.props).toEqual({ view: 'cards', city: 'Tokyo' });
    expect(result.ok && result.value.changes[0]?.kind).toBe(ChangeKind.PropsChanged);
  });

  it('rejects UnknownTarget for a missing tile or widget', () => {
    const missing = engine.apply(seeded(), { type: OpType.SetWidgetProps, board: BOARD, tile: tileId('t0'), widget: widgetId('nope'), props: {} });
    expect(missing.ok ? null : missing.error.reason).toBe(RejectReason.UnknownTarget);
  });
});
