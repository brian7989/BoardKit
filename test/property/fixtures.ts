import { createEngine, boardId, cell, type Engine, type Size } from '../../packages/core/src/index.ts';

export const GRID_COLS = 4;
export const GRID_ROWS = 4;
export const WIDGET_TYPE = 'demo.widget';
export const SIZE_SMALL: Size = { w: cell(1), h: cell(1) };
export const SIZE_HUGE: Size = { w: cell(GRID_COLS + 1), h: cell(GRID_ROWS + 1) };
export const DEFAULT_BOARD = boardId('default');

// A minimal, fixed config shared by every property test: one 1x1 size, one widget type, a
// small enough grid that branch-and-bound explores exhaustively within its node budget.
// SIZE_HUGE is larger than the grid itself, so a widget resized to it always overflows — used
// only to exercise the OutOfBounds path once the size-allowed check has already passed.
export function makeTestEngine(): Engine {
  return createEngine({
    grid: { cols: GRID_COLS, rows: GRID_ROWS },
    catalog: { [WIDGET_TYPE]: { sizes: [SIZE_SMALL, SIZE_HUGE] } },
  });
}

export interface RawTile {
  readonly id: string;
  readonly col: number;
  readonly row: number;
}

// A raw (unbranded) BoardsState for the fixture engine, ready for engine.parse.
export function rawState(tiles: readonly RawTile[]): unknown {
  return {
    version: 1,
    grid: { cols: GRID_COLS, rows: GRID_ROWS },
    boards: [
      {
        id: DEFAULT_BOARD,
        tiles: tiles.map((tile) => ({
          id: tile.id,
          col: tile.col,
          row: tile.row,
          size: SIZE_SMALL,
          items: [{ id: `${tile.id}-widget`, type: WIDGET_TYPE }],
          active: 0,
        })),
      },
    ],
  };
}
