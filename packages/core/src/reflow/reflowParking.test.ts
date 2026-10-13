import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, RejectReason, ReflowChangeKind, type BoardsState, type Engine } from '../index.js';

const CATALOG = {
  small: { sizes: [{ w: cell(1), h: cell(1) }] },
  wide: { sizes: [{ w: cell(3), h: cell(1) }] },
  other: { sizes: [{ w: cell(3), h: cell(1) }] },
};
const DESKTOP = createEngine({ grid: { cols: 6, rows: 4 }, catalog: CATALOG });
const TABLET = createEngine({ grid: { cols: 4, rows: 4 }, catalog: CATALOG });
const PHONE = createEngine({ grid: { cols: 2, rows: 4 }, catalog: CATALOG });
const B = boardId('default');

function apply(engine: Engine, state: BoardsState, op: Parameters<Engine['apply']>[1]): BoardsState {
  const result = engine.apply(state, op);
  if (!result.ok) throw new Error(`fixture op failed: ${result.error.reason}`);
  return result.value.state;
}

function seed(): BoardsState {
  let state = DESKTOP.empty();
  state = apply(DESKTOP, state, { type: OpType.Add, board: B, tileId: tileId('wide'), widget: { id: widgetId('w-wide'), type: 'wide' }, size: { w: cell(3), h: cell(1) }, at: { x: cell(2), y: cell(1) } });
  state = apply(DESKTOP, state, { type: OpType.Add, board: B, tileId: tileId('small'), widget: { id: widgetId('w-small'), type: 'small' }, size: { w: cell(1), h: cell(1) }, at: { x: cell(0), y: cell(0) } });
  return state;
}

function where(state: BoardsState, id: string): string | undefined {
  for (const board of state.boards) {
    const tile = board.tiles.find((candidate) => candidate.id === id);
    if (tile) return `${board.id}:${tile.col},${tile.row}`;
  }
  return undefined;
}

describe('reflow parks tiles that fit no size, instead of deleting them', () => {
  it('parks a tile too wide for the phone, then restores it to its exact desktop spot', () => {
    const phone = PHONE.reflow(seed());
    expect(where(phone.state, 'wide')).toBeUndefined();
    expect(phone.state.parked.map((tile) => tile.id)).toEqual([tileId('wide')]);
    expect(phone.changes).toContainEqual({ tile: tileId('wide'), board: B, kind: ReflowChangeKind.Dropped });

    const back = DESKTOP.reflow(phone.state).state;
    expect(where(back, 'wide')).toBe('default:2,1');
    expect(back.parked).toEqual([]);
  });

  it('places a parked tile on the first grid it fits, even one with no saved spot for it', () => {
    const tablet = TABLET.reflow(PHONE.reflow(seed()).state).state;
    expect(where(tablet, 'wide')).toBeDefined();
    expect(tablet.parked).toEqual([]);
  });

  it('keeps one parked copy across repeated reflows between grids it fits neither', () => {
    const tiny = createEngine({ grid: { cols: 1, rows: 4 }, catalog: CATALOG });
    const state = tiny.reflow(PHONE.reflow(seed()).state).state;
    expect(state.parked.map((tile) => tile.id)).toEqual([tileId('wide')]);
    expect(PHONE.reflow(state).state.parked.map((tile) => tile.id)).toEqual([tileId('wide')]);
  });

  it('parks and restores a whole stack with all of its widgets', () => {
    const stacked = apply(DESKTOP, seed(), { type: OpType.StackNew, board: B, onto: tileId('wide'), widget: { id: widgetId('w-other'), type: 'other', props: { k: 1 } } });
    const back = DESKTOP.reflow(PHONE.reflow(stacked).state).state;
    const tile = back.boards[0]?.tiles.find((candidate) => candidate.id === tileId('wide'));
    expect(tile?.items.map((item) => item.id)).toEqual([widgetId('w-wide'), widgetId('w-other')]);
    expect(tile?.items[1]?.props).toEqual({ k: 1 });
  });

  it('parks a floating tile too wide for the phone and restores it floating', () => {
    const floated = apply(DESKTOP, seed(), { type: OpType.SetFloating, board: B, tile: tileId('wide'), floating: true });
    const phone = PHONE.reflow(floated).state;
    expect(phone.parked.map((tile) => tile.id)).toEqual([tileId('wide')]);
    expect(DESKTOP.reflow(phone).state.boards[0]?.tiles.find((tile) => tile.id === tileId('wide'))?.float).toBeDefined();
  });

  it('round-trips parked tiles through serialize and parse', () => {
    const phone = PHONE.reflow(seed()).state;
    const parsed = PHONE.parse(JSON.parse(JSON.stringify(PHONE.serialize(phone))));
    expect(parsed.ok && parsed.value.parked.map((tile) => tile.id)).toEqual([tileId('wide')]);
  });

  it('reads a save with no parked field as nothing parked, and rejects a malformed one', () => {
    const raw = JSON.parse(JSON.stringify(DESKTOP.serialize(seed())));
    delete raw.parked;
    const parsed = DESKTOP.parse(raw);
    expect(parsed.ok && parsed.value.parked).toEqual([]);
    expect(DESKTOP.parse({ ...raw, parked: 'nope' }).ok).toBe(false);
  });

  it('keeps a parked tile id taken: adding a tile with it is rejected, not duplicated', () => {
    const phone = PHONE.reflow(seed()).state;
    const result = PHONE.apply(phone, { type: OpType.Add, board: B, tileId: tileId('wide'), widget: { id: widgetId('w-new'), type: 'small' }, size: { w: cell(1), h: cell(1) } });
    expect(result.ok ? null : result.error.reason).toBe(RejectReason.DuplicateId);
  });

  it('carries parked tiles through ordinary ops on the narrow grid', () => {
    const phone = PHONE.reflow(seed()).state;
    const moved = apply(PHONE, phone, { type: OpType.Move, board: B, tile: tileId('small'), to: { x: cell(1), y: cell(2) } });
    expect(moved.parked.map((tile) => tile.id)).toEqual([tileId('wide')]);
  });
});

describe('reflow keeps a floating tile whose page a restored layout lacks', () => {
  it('moves it to the first page instead of losing it', () => {
    const withPage = apply(DESKTOP, seed(), { type: OpType.AddBoard, board: boardId('page-2') });
    // Desktop's remembered layout only knows the pages that had tiles: just "default".
    const phone = PHONE.reflow(withPage).state;
    const floating = apply(PHONE, phone, {
      type: OpType.Add,
      board: boardId('page-2'),
      tileId: tileId('f'),
      widget: { id: widgetId('w-f'), type: 'small' },
      size: { w: cell(1), h: cell(1) },
      float: { x: 0.5, y: 0.5, free: true },
    });
    const restored = DESKTOP.reflow(floating).state;
    expect(restored.boards.map((board) => board.id)).toEqual([B]);
    expect(restored.boards[0]?.tiles.some((tile) => tile.id === tileId('f'))).toBe(true);
  });
});
