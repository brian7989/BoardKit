import type { CSSProperties } from 'react';

export interface BoardGrid {
  readonly cols: number;
  readonly rows: number;
  readonly cellAspect: number;
}

// Container query units size the board as large as possible while fitting cols:rows × cellAspect within its container.
export function boardStyle(grid: BoardGrid): CSSProperties {
  const aspect = (grid.cols * grid.cellAspect) / grid.rows;
  return {
    containerType: 'size',
    position: 'relative',
    overflow: 'clip',
    aspectRatio: `${aspect}`,
    width: `min(100cqw, calc(100cqh * ${aspect}))`,
  };
}
