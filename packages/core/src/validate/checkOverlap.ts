import { rectOfTile, rectsIntersect } from '../shared/index.js';
import type { Rect } from '../shared/geometry/Rect.js';
import { cell, type Cell } from '../shared/units/Cell.js';
import { IssueKind, type Issue } from '../issues/index.js';
import { layerOf, TileLayer, type Board, type Tile, type ValidCandidate } from '../model/index.js';

export function checkOverlap(state: ValidCandidate): readonly Issue[] {
  return state.boards.flatMap((board) => [...issuesForLayer(board, TileLayer.Grid), ...issuesForLayer(board, TileLayer.Overlay)]);
}

// Each layer collides only with itself: Grid tiles today as always, snapped Overlay tiles among
// themselves, and a Free tile with nothing — it never collides with anything, on any layer.
function issuesForLayer(board: Board, layer: TileLayer): readonly Issue[] {
  const tiles = board.tiles.filter((tile) => layerOf(tile) === layer);
  const rects = tiles.map((tile) => rectOfTile(originOf(tile), tile.size));
  const issues: Issue[] = [];
  for (let index = 0; index < tiles.length; index += 1) {
    issues.push(...overlapsWithLater({ tiles, rects, index, boardId: board.id }));
  }
  return issues;
}

function originOf(tile: Tile): { readonly x: Cell; readonly y: Cell } {
  return tile.float ? { x: cell(tile.float.x), y: cell(tile.float.y) } : { x: tile.col, y: tile.row };
}

interface OverlapsInput {
  readonly tiles: readonly Tile[];
  readonly rects: readonly Rect<Cell>[];
  readonly index: number;
  readonly boardId: Board['id'];
}

function overlapsWithLater(input: OverlapsInput): readonly Issue[] {
  const { tiles, rects, index, boardId } = input;
  const tile = tiles[index];
  const rect = rects[index];
  if (!tile || !rect) return [];

  const issues: Issue[] = [];
  for (let j = index + 1; j < tiles.length; j += 1) {
    const other = tiles[j];
    const otherRect = rects[j];
    if (other && otherRect && rectsIntersect(rect, otherRect)) {
      issues.push({ kind: IssueKind.Overlap, board: boardId, tile: tile.id, message: `Tile ${tile.id} overlaps ${other.id}.` });
    }
  }
  return issues;
}
