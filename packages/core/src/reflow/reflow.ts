import { markValid, isFloating, type Board, type BoardsState, type LayoutTile } from '../model/index.js';
import { validateState } from '../validate/index.js';
import type { EngineContext } from '../engine/EngineContext.js';
import type { BoardId } from '../shared/ids/BoardId.js';
import type { TileId } from '../shared/ids/TileId.js';
import { flattenReadingOrder, type ReflowEntry } from './flattenReadingOrder.js';
import { placeFloatingTile } from './placeFloatingTile.js';
import { placeGridTile } from './placeGridTile.js';
import { placeAtSavedSpot } from './placeAtSavedSpot.js';
import { snapshotLayout } from './snapshotLayout.js';
import { gridKey } from './gridKey.js';
import type { Page } from './Page.js';
import type { ReflowChange } from './ReflowChange.js';
import type { ReflowResult } from './ReflowResult.js';

function toBoard(page: Page): Board {
  return { id: page.id, tiles: page.tiles };
}

// Restoring a saved layout keeps exactly its own pages; a fresh reflow (no saved layout for the
// target grid) keeps the incoming state's pages, even ones the reflow leaves empty.
function initialPages(state: BoardsState, saved: readonly LayoutTile[] | undefined): Page[] {
  if (!saved) return state.boards.map((board) => ({ id: board.id, tiles: [], isNew: false }));
  const ids: BoardId[] = [];
  for (const entry of saved) if (!ids.includes(entry.board)) ids.push(entry.board);
  return ids.map((id) => ({ id, tiles: [], isNew: false }));
}

function savedPositions(saved: readonly LayoutTile[] | undefined): Map<TileId, LayoutTile> {
  const byTile = new Map<TileId, LayoutTile>();
  for (const entry of saved ?? []) byTile.set(entry.tile, entry);
  return byTile;
}

interface PlaceOneInput {
  readonly entry: ReflowEntry;
  readonly at: LayoutTile | undefined;
  readonly ctx: EngineContext;
  readonly pages: Page[];
  readonly changes: ReflowChange[];
}

function placeOne(input: PlaceOneInput): void {
  const { entry, at, ctx, pages, changes } = input;
  if (at) {
    placeAtSavedSpot({ entry, at, ctx, pages, changes });
    return;
  }
  const place = isFloating(entry.tile) ? placeFloatingTile : placeGridTile;
  place({ entry, ctx, pages, changes });
}

interface FinalizeInput {
  readonly state: BoardsState;
  readonly fromKey: string;
  readonly toKey: string;
  readonly pages: readonly Page[];
  readonly ctx: EngineContext;
  readonly changes: readonly ReflowChange[];
}

function finalize(input: FinalizeInput): ReflowResult {
  const { state, fromKey, toKey, pages, ctx, changes } = input;
  const boards = pages.map(toBoard);
  const layouts = { ...state.layouts, [fromKey]: snapshotLayout(state.boards), [toKey]: snapshotLayout(boards) };
  const candidate = { grid: { cols: ctx.grid.cols, rows: ctx.grid.rows }, boards, layouts };
  const issues = validateState(candidate, ctx);
  if (issues.length > 0) throw new Error(`reflow produced an invalid state: ${issues.map((issue) => issue.message).join('; ')}`);
  return { state: markValid(candidate), changes };
}

// Switches `state` onto `ctx`'s grid: restores its saved layout if one exists, otherwise repacks
// in reading order. Either way, the grid being left is snapshotted for a later switch back.
export function reflow(state: BoardsState, ctx: EngineContext): ReflowResult {
  const fromKey = gridKey(state.grid);
  const toKey = gridKey(ctx.grid);
  if (fromKey === toKey) return { state, changes: [] };

  const saved = state.layouts[toKey];
  const pages = initialPages(state, saved);
  const savedByTile = savedPositions(saved);
  const changes: ReflowChange[] = [];

  for (const entry of flattenReadingOrder(state.boards)) {
    placeOne({ entry, at: savedByTile.get(entry.tile.id), ctx, pages, changes });
  }

  return finalize({ state, fromKey, toKey, pages, ctx, changes });
}
