import { describe, expect, it, vi } from 'vitest';
import { runEffects } from './runEffects.js';
import { EffectType } from '../events/EffectType.js';
import { AnnouncementKey } from '../events/AnnouncementKey.js';
import { RejectReason } from '../../ops/outcome/RejectReason.js';
import { createEngine, boardId, tileId, widgetId, cell, OpType, type Engine } from '../../index.js';
import type { Effect } from '../events/Effect.js';

const BOARD = boardId('default');
const MOVE_OP = { type: OpType.Move, board: BOARD, tile: tileId('t0'), to: { x: cell(1), y: cell(0) } } as const;

function makeEngine(): Engine {
  return createEngine({ grid: { cols: 4, rows: 4 }, catalog: { widget: { sizes: [{ w: cell(1), h: cell(1) }] } } });
}

describe('runEffects', () => {
  it('routes each effect to its matching callback, in order', () => {
    const engine = makeEngine();
    const added = engine.apply(engine.empty(), {
      type: OpType.Add,
      board: BOARD,
      tileId: tileId('t0'),
      widget: { id: widgetId('w0'), type: 'widget' },
      size: { w: cell(1), h: cell(1) },
    });
    if (!added.ok) throw new Error('fixture add should succeed');

    const onCommit = vi.fn();
    const onReject = vi.fn();
    const onAnnounce = vi.fn();
    const effects: Effect[] = [
      { type: EffectType.Announce, key: AnnouncementKey.PickedUp, params: {} },
      { type: EffectType.Reject, rejection: { reason: RejectReason.OutOfBounds }, op: MOVE_OP },
      { type: EffectType.Commit, op: MOVE_OP, applied: added.value },
    ];

    runEffects(effects, { onCommit, onReject, onAnnounce });

    expect(onAnnounce).toHaveBeenCalledWith(AnnouncementKey.PickedUp, {});
    expect(onReject).toHaveBeenCalledWith({ reason: RejectReason.OutOfBounds }, MOVE_OP);
    expect(onCommit).toHaveBeenCalledWith(MOVE_OP, added.value);
  });

  it('tolerates missing callbacks entirely', () => {
    expect(() =>
      runEffects([{ type: EffectType.Announce, key: AnnouncementKey.Cancelled, params: {} }], {}),
    ).not.toThrow();
  });
});
