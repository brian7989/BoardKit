import { describe, expect, it } from 'vitest';
import { createEngine, boardId, tileId, widgetId, cell, OpType, STATE_VERSION, type BoardsState, type Engine } from '../index.js';
import { ReflowChangeKind } from './ReflowChangeKind.js';

const DESKTOP = { cols: 6, rows: 4 };
const PHONE = { cols: 2, rows: 4 };

const CATALOG = {
  small: { sizes: [{ w: cell(1), h: cell(1) }] },
  flex: { sizes: [{ w: cell(4), h: cell(2) }, { w: cell(2), h: cell(2) }, { w: cell(1), h: cell(1) }] },
  huge: { sizes: [{ w: cell(5), h: cell(1) }] },
  // Declared smallest-first, so shrinking picks the largest fit regardless of declaration order.
  grow: { sizes: [{ w: cell(1), h: cell(1) }, { w: cell(2), h: cell(2) }, { w: cell(3), h: cell(1) }] },
};

function engineFor(grid: { readonly cols: number; readonly rows: number }): Engine {
  return createEngine({ grid, catalog: CATALOG });
}

interface RawTileInput {
  readonly id: string;
  readonly col: number;
  readonly row: number;
  readonly type: keyof typeof CATALOG;
  readonly size?: { readonly w: number; readonly h: number };
  readonly float?: { readonly x: number; readonly y: number };
}

function rawTile(input: RawTileInput) {
  const { id, col, row, type, float } = input;
  const size = input.size ?? CATALOG[type].sizes[0];
  return { id, col, row, size, active: 0, items: [{ id: `${id}-w`, type }], ...(float ? { float } : {}) };
}

function stateOn(grid: { readonly cols: number; readonly rows: number }, boards: readonly unknown[]): BoardsState {
  const parsed = engineFor(grid).parse({ version: STATE_VERSION, grid, boards });
  if (!parsed.ok) throw new Error('fixture state should parse');
  return parsed.value;
}

// Tile array order isn't part of "the same layout" — only each tile's own board and position is.
function positionsOf(state: BoardsState) {
  return state.boards
    .flatMap((board) => board.tiles.map((tile) => ({ board: board.id, id: tile.id, col: tile.col, row: tile.row, size: tile.size, float: tile.float })))
    .sort((a, b) => a.id.localeCompare(b.id));
}

describe('reflow', () => {
  it('is a no-op when the target grid matches the current one', () => {
    const state = stateOn(DESKTOP, [{ id: 'default', tiles: [rawTile({ id: 't0', col: 0, row: 0, type: 'small' })] }]);
    const result = engineFor(DESKTOP).reflow(state);
    expect(result).toEqual({ state, changes: [] });
  });

  it('shrinks, drops, and spills overflow onto a deterministic new page in reading order', () => {
    const desktop = stateOn(DESKTOP, [
      {
        id: 'default',
        tiles: [
          rawTile({ id: 't1', col: 0, row: 0, type: 'small' }),
          rawTile({ id: 't2', col: 1, row: 0, type: 'flex', size: { w: 4, h: 2 } }),
          rawTile({ id: 't3', col: 0, row: 2, type: 'huge' }),
          rawTile({ id: 't4', col: 0, row: 3, type: 'small' }),
          rawTile({ id: 't5', col: 1, row: 3, type: 'small' }),
          rawTile({ id: 't6', col: 2, row: 3, type: 'small' }),
          rawTile({ id: 't7', col: 3, row: 3, type: 'small' }),
          rawTile({ id: 't8', col: 4, row: 3, type: 'small' }),
          rawTile({ id: 't9', col: 5, row: 3, type: 'small' }),
        ],
      },
    ]);

    const result = engineFor(PHONE).reflow(desktop);
    const byId = (id: string) =>
      result.state.boards.flatMap((board) => board.tiles.map((tile) => ({ ...tile, board: board.id }))).find((t) => t.id === tileId(id));

    expect(result.state.boards.map((board) => board.id)).toEqual([boardId('default'), boardId('reflow-page-1')]);
    expect(byId('t2')).toMatchObject({ size: { w: 2, h: 2 }, board: boardId('default') });
    expect(byId('t3')).toBeUndefined();
    expect(byId('t7')?.board).toBe(boardId('reflow-page-1'));
    expect(byId('t8')?.board).toBe(boardId('reflow-page-1'));
    expect(byId('t9')?.board).toBe(boardId('reflow-page-1'));

    expect(result.changes).toEqual(
      expect.arrayContaining([
        { tile: tileId('t2'), board: boardId('default'), kind: ReflowChangeKind.Resized },
        { tile: tileId('t3'), board: boardId('default'), kind: ReflowChangeKind.Dropped },
        { board: boardId('reflow-page-1'), kind: ReflowChangeKind.PageAdded },
        { tile: tileId('t7'), board: boardId('reflow-page-1'), kind: ReflowChangeKind.Moved },
        { tile: tileId('t8'), board: boardId('reflow-page-1'), kind: ReflowChangeKind.Moved },
        { tile: tileId('t9'), board: boardId('reflow-page-1'), kind: ReflowChangeKind.Moved },
      ]),
    );
  });

  it('shrinks to the largest fitting size regardless of the catalog\'s declaration order', () => {
    const desktop = stateOn(DESKTOP, [{ id: 'default', tiles: [rawTile({ id: 't1', col: 0, row: 0, type: 'grow', size: { w: 3, h: 1 } })] }]);
    const result = engineFor(PHONE).reflow(desktop);
    expect(result.state.boards[0]?.tiles[0]).toMatchObject({ size: { w: 2, h: 2 } });
  });

  it('drops a tile whose widget type the target grid\'s catalog does not even register', () => {
    // "huge" doesn't fit phone's 2 columns either way, so fitSize must consult the catalog —
    // and a target engine that never registered it has nothing to shrink to.
    const desktop = stateOn(DESKTOP, [{ id: 'default', tiles: [rawTile({ id: 't1', col: 0, row: 0, type: 'huge' })] }]);
    const bareEngine = createEngine({ grid: PHONE, catalog: {} });
    const result = bareEngine.reflow(desktop);
    expect(result.state.boards[0]?.tiles).toEqual([]);
    expect(result.changes).toContainEqual({ tile: tileId('t1'), board: boardId('default'), kind: ReflowChangeKind.Dropped });
  });

  it('throws rather than silently colliding when a generated page id already names an existing board', () => {
    // Two one-cell original pages, three tiles: the third forces `openPage` while exactly two
    // pages exist, generating "reflow-page-2" — which this fixture's second board already is.
    const desktop = stateOn(DESKTOP, [
      { id: 'default', tiles: [rawTile({ id: 't1', col: 0, row: 0, type: 'small' }), rawTile({ id: 't2', col: 1, row: 0, type: 'small' })] },
      { id: 'reflow-page-2', tiles: [rawTile({ id: 't3', col: 0, row: 0, type: 'small' })] },
    ]);
    expect(() => engineFor({ cols: 1, rows: 1 }).reflow(desktop)).toThrow(/reflow produced an invalid state/);
  });

  it('keeps a pre-existing empty page rather than removing it', () => {
    const desktop = stateOn(DESKTOP, [
      { id: 'default', tiles: [rawTile({ id: 't1', col: 0, row: 0, type: 'small' })] },
      { id: 'empty', tiles: [] },
    ]);
    const result = engineFor(PHONE).reflow(desktop);
    expect(result.state.boards.map((board) => board.id)).toEqual([boardId('default'), boardId('empty')]);
  });

  it('clamps a floating tile into bounds and shrinks or drops it like any other', () => {
    const desktop = stateOn(DESKTOP, [
      {
        id: 'default',
        tiles: [
          rawTile({ id: 'float-ok', col: 0, row: 0, type: 'flex', size: { w: 4, h: 2 }, float: { x: 5, y: 3 } }),
          rawTile({ id: 'float-gone', col: 0, row: 2, type: 'huge', float: { x: 0, y: 2 } }),
        ],
      },
    ]);
    const result = engineFor(PHONE).reflow(desktop);
    const tile = result.state.boards[0]?.tiles.find((candidate) => candidate.id === tileId('float-ok'));
    expect(tile).toMatchObject({ size: { w: 2, h: 2 }, float: { x: 0, y: 2 } });
    expect(result.state.boards[0]?.tiles.some((candidate) => candidate.id === tileId('float-gone'))).toBe(false);
    expect(result.changes).toContainEqual({ tile: tileId('float-gone'), board: boardId('default'), kind: ReflowChangeKind.Dropped });
  });

  it('restores a saved layout exactly on an unedited round trip, and keeps other breakpoints untouched by an edit', () => {
    const desktop = stateOn(DESKTOP, [
      {
        id: 'default',
        tiles: [rawTile({ id: 't1', col: 0, row: 0, type: 'small' }), rawTile({ id: 't2', col: 1, row: 0, type: 'flex', size: { w: 4, h: 2 } })],
      },
    ]);
    const toPhone = engineFor(PHONE).reflow(desktop);
    const backToDesktop = engineFor(DESKTOP).reflow(toPhone.state);

    expect(positionsOf(backToDesktop.state)).toEqual(positionsOf(desktop));
    expect(backToDesktop.changes).toEqual([]);

    // Editing the phone layout must not touch the desktop layout saved above.
    const editedPhone = engineFor(PHONE).apply(toPhone.state, {
      type: OpType.Move,
      board: boardId('default'),
      tile: tileId('t1'),
      to: { x: cell(1), y: cell(3) },
    });
    if (!editedPhone.ok) throw new Error('fixture move should succeed');
    const afterEdit = engineFor(DESKTOP).reflow(editedPhone.value.state);
    expect(positionsOf(afterEdit.state)).toEqual(positionsOf(desktop));
  });

  it('places a tile added after a layout was saved via findSpot, and drops one since removed', () => {
    const desktop = stateOn(DESKTOP, [{ id: 'default', tiles: [rawTile({ id: 't1', col: 0, row: 0, type: 'small' })] }]);
    const toPhone = engineFor(PHONE).reflow(desktop); // saves layouts for both grids, phone's holding only t1
    const backToDesktop = engineFor(DESKTOP).reflow(toPhone.state);

    const withNewTile = engineFor(DESKTOP).apply(backToDesktop.state, {
      type: OpType.Add,
      board: boardId('default'),
      tileId: tileId('t2'),
      widget: { id: widgetId('t2-w'), type: 'small' },
      size: { w: cell(1), h: cell(1) },
    });
    if (!withNewTile.ok) throw new Error('fixture add should succeed');
    const withRemoval = engineFor(DESKTOP).apply(withNewTile.value.state, { type: OpType.Remove, board: boardId('default'), tile: tileId('t1') });
    if (!withRemoval.ok) throw new Error('fixture remove should succeed');

    const backToPhone = engineFor(PHONE).reflow(withRemoval.value.state);
    const ids = backToPhone.state.boards.flatMap((board) => board.tiles.map((tile) => tile.id));
    expect(ids).toEqual([tileId('t2')]);
  });
});
