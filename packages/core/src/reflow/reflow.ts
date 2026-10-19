import { markValid, isFloating, type Board, type BoardsState, type LayoutTile, type Tile } from '../model/index.js';
import { validateState } from '../validate/index.js';
import type { EngineContext } from '../engine/EngineContext.js';
import { boardId, type BoardId } from '../shared/ids/BoardId.js';
import { flattenReadingOrder } from './flattenReadingOrder.js';
import { placeFloatingTile } from './placeFloatingTile.js';
import { placeGridTile } from './placeGridTile.js';
import { placeAtSavedSpot } from './placeAtSavedSpot.js';
import { snapshotLayout } from './snapshotLayout.js';
import { recompose, type Recomposition } from './recompose.js';
import { gridKey } from './gridKey.js';
import type { Page } from './Page.js';
import type { ReflowChange } from './ReflowChange.js';
import type { ReflowResult } from './ReflowResult.js';

const DEFAULT_PAGE = boardId('default');

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

interface PlaceAllInput {
  readonly recomposition: Recomposition;
  readonly ctx: EngineContext;
  readonly pages: Page[];
  readonly changes: ReflowChange[];
  readonly parked: Tile[];
}

// Saved spots go down first: a tile with no saved spot searches for free space, and placed
// earlier it could take a spot a restored tile is about to be put back into verbatim.
function placeAll(input: PlaceAllInput): void {
  const { recomposition, ctx, pages, changes, parked } = input;
  for (const { entry, at } of recomposition.saved) placeAtSavedSpot({ entry, at, ctx, pages, changes, parked });
  for (const entry of recomposition.fresh) {
    const place = isFloating(entry.tile) ? placeFloatingTile : placeGridTile;
    place({ entry, ctx, pages, changes, parked });
  }
}

interface FinalizeInput {
  readonly state: BoardsState;
  readonly fromKey: string;
  readonly toKey: string;
  readonly pages: readonly Page[];
  readonly ctx: EngineContext;
  readonly changes: readonly ReflowChange[];
  readonly parked: readonly Tile[];
}

function finalize(input: FinalizeInput): ReflowResult {
  const { state, fromKey, toKey, pages, ctx, changes, parked } = input;
  const boards = pages.map(toBoard);
  const firstPage = boards[0]?.id ?? DEFAULT_PAGE;
  const layouts = { ...state.layouts, [fromKey]: snapshotLayout(state.boards, state.parked, state.boards[0]?.id ?? firstPage), [toKey]: snapshotLayout(boards, parked, firstPage) };
  const candidate = { grid: { cols: ctx.grid.cols, rows: ctx.grid.rows }, boards, layouts, parked };
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
  const changes: ReflowChange[] = [];
  const parked: Tile[] = [];
  // Previously parked tiles get another chance on every grid, after the tiles already showing.
  const firstPage = pages[0]?.id ?? DEFAULT_PAGE;
  const entries = [...flattenReadingOrder(state.boards), ...state.parked.map((tile) => ({ tile, board: firstPage }))];
  const recomposition = saved ? recompose(entries, saved, ctx) : { saved: [], fresh: entries };
  placeAll({ recomposition, ctx, pages, changes, parked });

  return finalize({ state, fromKey, toKey, pages, ctx, changes, parked });
}
