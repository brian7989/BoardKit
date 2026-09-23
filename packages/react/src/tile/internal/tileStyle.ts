import type { CSSProperties } from 'react';
import type { Size } from 'boardkit-core';
import { CssVar, cssVars } from '../../shared/index.js';

export interface TileGrid {
  readonly cols: number;
  readonly rows: number;
}

export interface TilePosition {
  readonly col: number;
  readonly row: number;
}

const PERCENT = 100;

// Positioned via `transform: translate(...)` (compositor-only) rather than left/top; percentages
// are relative to the tile's own box, so moving by `col` cells is `(col / size.w) * 100%`.
export function tileStyle(position: TilePosition, size: Size, grid: TileGrid): CSSProperties {
  return cssVars(
    {
      position: 'absolute',
      left: 0,
      top: 0,
      width: `${(size.w / grid.cols) * PERCENT}%`,
      height: `${(size.h / grid.rows) * PERCENT}%`,
      transform: `translate(${(position.col / size.w) * PERCENT}%, ${(position.row / size.h) * PERCENT}%)`,
      transition: 'transform 150ms ease',
    },
    {
      [CssVar.Col]: position.col,
      [CssVar.Row]: position.row,
      [CssVar.Cols]: grid.cols,
      [CssVar.Rows]: grid.rows,
    },
  );
}
