import { describe, expect, it } from 'vitest';
import { checkOverlap } from './checkOverlap.js';
import { IssueKind } from '../issues/IssueKind.js';
import { boardId } from '../shared/ids/BoardId.js';
import { tileId } from '../shared/ids/TileId.js';
import { widgetId } from '../shared/ids/WidgetId.js';
import { cell } from '../shared/units/Cell.js';
import type { ValidCandidate } from '../model/BoardsState.js';
import type { Tile } from '../model/Tile.js';

interface MakeTileOptions {
  readonly col: number;
  readonly row: number;
  readonly size?: Tile['size'];
  readonly float?: Tile['float'];
}

function makeTile(id: string, options: MakeTileOptions): Tile {
  return {
    id: tileId(id),
    col: cell(options.col),
    row: cell(options.row),
    size: options.size ?? { w: cell(1), h: cell(1) },
    items: [{ id: widgetId(`${id}-w`), type: 'x' }],
    active: 0,
    ...(options.float ? { float: options.float } : {}),
  };
}

function candidate(tiles: readonly Tile[]): ValidCandidate {
  return { grid: { cols: 4, rows: 4 }, boards: [{ id: boardId('default'), tiles }] };
}

describe('checkOverlap', () => {
  it('reports nothing for tiles that do not overlap', () => {
    expect(checkOverlap(candidate([makeTile('a', { col: 0, row: 0 }), makeTile('b', { col: 1, row: 0 })]))).toEqual([]);
  });

  it('reports Overlap, named on the earlier tile, for two tiles occupying the same cell', () => {
    const issues = checkOverlap(candidate([makeTile('a', { col: 0, row: 0 }), makeTile('b', { col: 0, row: 0 })]));
    expect(issues).toEqual([{ kind: IssueKind.Overlap, board: boardId('default'), tile: tileId('a'), message: 'Tile a overlaps b.' }]);
  });

  it('reports one issue per later tile a given tile overlaps', () => {
    // 'a' is a 2x2 tile spanning both 'b' and 'c', which do not overlap each other.
    const a = makeTile('a', { col: 0, row: 0, size: { w: cell(2), h: cell(2) } });
    const issues = checkOverlap(candidate([a, makeTile('b', { col: 0, row: 0 }), makeTile('c', { col: 1, row: 1 })]));
    expect(issues).toHaveLength(2);
    expect(issues.every((issue) => issue.tile === tileId('a'))).toBe(true);
  });

  it('exempts a floating tile from ever overlapping anything', () => {
    const floating = makeTile('a', { col: 0, row: 0, float: { x: 0, y: 0 } });
    expect(checkOverlap(candidate([floating, makeTile('b', { col: 0, row: 0 })]))).toEqual([]);
  });
});
