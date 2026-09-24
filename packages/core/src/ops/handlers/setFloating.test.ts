import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, RejectReason, ChangeKind, type BoardsState, type Engine } from '../../index.js';

const GRID = { cols: 4, rows: 4 };
const BOARD = boardId('default');
const WIDGET_TYPE = 'demo.widget';
const SIZE_SMALL = { w: cell(1), h: cell(1) };

const SIZE_BIG = { w: cell(2), h: cell(2) };

function makeEngine(): Engine {
  return createEngine({ grid: GRID, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL, SIZE_BIG] } } });
}

interface AddTileOptions {
  readonly id: string;
  readonly col: number;
  readonly row: number;
}

function addTile(engine: Engine, state: BoardsState, options: AddTileOptions) {
  return engine.apply(state, {
    type: OpType.Add,
    board: BOARD,
    tileId: tileId(options.id),
    widget: { id: widgetId(`${options.id}-w`), type: WIDGET_TYPE },
    size: SIZE_SMALL,
    at: { x: cell(options.col), y: cell(options.row) },
  });
}

describe('setFloating', () => {
  it('rejects UnknownTarget for a missing board or tile', () => {
    const engine = makeEngine();
    const seeded = addTile(engine, engine.empty(), { id: 't0', col: 0, row: 0 });
    if (!seeded.ok) throw new Error('fixture add should succeed');
    expect(engine.apply(seeded.value.state, { type: OpType.SetFloating, board: boardId('nope'), tile: tileId('t0'), floating: true })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
    expect(engine.apply(seeded.value.state, { type: OpType.SetFloating, board: BOARD, tile: tileId('nope'), floating: true })).toEqual({
      ok: false,
      error: { reason: RejectReason.UnknownTarget },
    });
  });

  it('starts floating from the tile\'s current grid position', () => {
    const engine = makeEngine();
    const seeded = addTile(engine, engine.empty(), { id: 't0', col: 1, row: 2 });
    if (!seeded.ok) throw new Error('fixture add should succeed');

    const result = engine.apply(seeded.value.state, { type: OpType.SetFloating, board: BOARD, tile: tileId('t0'), floating: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tile = result.value.state.boards[0]?.tiles[0];
    expect(tile?.float).toEqual({ x: 1, y: 2 });
    expect(tile?.col).toBe(1);
    expect(tile?.row).toBe(2);
    expect(result.value.changes).toEqual([{ tile: tileId('t0'), board: BOARD, kind: ChangeKind.Floated }]);
  });

  it('keeps the same float position when asked to float again while already floating', () => {
    const engine = makeEngine();
    const seeded = addTile(engine, engine.empty(), { id: 't0', col: 1, row: 2 });
    if (!seeded.ok) throw new Error('fixture add should succeed');
    const started = engine.apply(seeded.value.state, { type: OpType.SetFloating, board: BOARD, tile: tileId('t0'), floating: true });
    if (!started.ok) throw new Error('fixture float should succeed');
    const moved = engine.apply(started.value.state, { type: OpType.MoveFloating, board: BOARD, tile: tileId('t0'), to: { x: 2.5, y: 0.5 } });
    if (!moved.ok) throw new Error('fixture moveFloating should succeed');

    const result = engine.apply(moved.value.state, { type: OpType.SetFloating, board: BOARD, tile: tileId('t0'), floating: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Overlay by default: MoveFloating already rounded 2.5/0.5 to the nearest cell.
    expect(result.value.state.boards[0]?.tiles[0]?.float).toEqual({ x: 3, y: 1 });
  });

  it('is a no-op, with no changes, when asked to stop floating a tile that is already grounded', () => {
    const engine = makeEngine();
    const seeded = addTile(engine, engine.empty(), { id: 't0', col: 0, row: 0 });
    if (!seeded.ok) throw new Error('fixture add should succeed');

    const result = engine.apply(seeded.value.state, { type: OpType.SetFloating, board: BOARD, tile: tileId('t0'), floating: false });
    expect(result).toEqual({ ok: true, value: { state: seeded.value.state, changes: [] } });
  });

  it('rejoins the grid at the rounded float position, clearing float and displacing an occupant', () => {
    const engine = makeEngine();
    const withOther = addTile(engine, engine.empty(), { id: 'occupant', col: 2, row: 2 });
    if (!withOther.ok) throw new Error('fixture add should succeed');
    const seeded = addTile(engine, withOther.value.state, { id: 't0', col: 0, row: 0 });
    if (!seeded.ok) throw new Error('fixture add should succeed');
    const started = engine.apply(seeded.value.state, { type: OpType.SetFloating, board: BOARD, tile: tileId('t0'), floating: true });
    if (!started.ok) throw new Error('fixture float should succeed');
    const moved = engine.apply(started.value.state, { type: OpType.MoveFloating, board: BOARD, tile: tileId('t0'), to: { x: 2.4, y: 1.6 } });
    if (!moved.ok) throw new Error('fixture moveFloating should succeed');

    const result = engine.apply(moved.value.state, { type: OpType.SetFloating, board: BOARD, tile: tileId('t0'), floating: false });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tiles = result.value.state.boards[0]?.tiles ?? [];
    const grounded = tiles.find((tile) => tile.id === tileId('t0'));
    expect(grounded).toMatchObject({ col: 2, row: 2 });
    expect(grounded?.float).toBeUndefined();
    expect(result.value.changes[0]).toMatchObject({ tile: tileId('t0'), kind: ChangeKind.Unfloated });
    expect(result.value.changes.some((change) => change.tile === tileId('occupant') && change.kind === ChangeKind.Moved)).toBe(true);
  });

  it('rejects NoValidArrangement when the solver cannot find a fitting arrangement in its node budget', () => {
    const engine = createEngine({ grid: GRID, catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL, SIZE_BIG] } }, solver: { maxNodes: 1 } });
    const withOther = addTile(engine, engine.empty(), { id: 'occupant', col: 1, row: 1 });
    if (!withOther.ok) throw new Error('fixture add should succeed');
    const seeded = addTile(engine, withOther.value.state, { id: 't0', col: 0, row: 0 });
    if (!seeded.ok) throw new Error('fixture add should succeed');
    const started = engine.apply(seeded.value.state, { type: OpType.SetFloating, board: BOARD, tile: tileId('t0'), floating: true });
    if (!started.ok) throw new Error('fixture float should succeed');
    const moved = engine.apply(started.value.state, { type: OpType.MoveFloating, board: BOARD, tile: tileId('t0'), to: { x: 1, y: 1 } });
    if (!moved.ok) throw new Error('fixture moveFloating should succeed');

    const result = engine.apply(moved.value.state, { type: OpType.SetFloating, board: BOARD, tile: tileId('t0'), floating: false });
    expect(result).toEqual({ ok: false, error: { reason: RejectReason.NoValidArrangement, blockedBy: [tileId('occupant')] } });
  });
});
