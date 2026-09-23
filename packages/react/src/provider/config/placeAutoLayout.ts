import { boardId, OpType, type BoardId, type BoardsState } from 'boardkit-core';
import type { InitialLayoutTile } from './InitialLayoutTile.js';
import type { InitialPlacementCtx } from './InitialPlacementCtx.js';
import { resolveInitialTile, type ResolvedInitialTile } from './resolveInitialTile.js';
import { addResolvedTile } from './addResolvedTile.js';

export interface AutoLayoutResult {
  readonly state: BoardsState;
  readonly pages: readonly BoardId[];
}

function firstFit(ctx: InitialPlacementCtx, progress: AutoLayoutResult, resolved: ResolvedInitialTile): BoardsState | null {
  for (const board of progress.pages) {
    const attempt = addResolvedTile({ config: ctx.config, state: progress.state, board, resolved });
    if (attempt.ok) return attempt.value.state;
  }
  return null;
}

function openNextPage(ctx: InitialPlacementCtx, progress: AutoLayoutResult): { readonly state: BoardsState; readonly board: BoardId } | null {
  const board = boardId(`page-${progress.pages.length}`);
  const opened = ctx.config.engine.apply(progress.state, { type: OpType.AddBoard, board });
  return opened.ok ? { state: opened.value.state, board } : null;
}

function placeOne(ctx: InitialPlacementCtx, progress: AutoLayoutResult, entry: InitialLayoutTile): AutoLayoutResult {
  const resolved = resolveInitialTile(ctx, entry);
  if (!resolved) return progress;
  const fitState = firstFit(ctx, progress, resolved);
  if (fitState) return { state: fitState, pages: progress.pages };
  const opened = openNextPage(ctx, progress);
  if (!opened) return progress;
  const attempt = addResolvedTile({ config: ctx.config, state: opened.state, board: opened.board, resolved });
  if (!attempt.ok) return progress;
  return { state: attempt.value.state, pages: [...progress.pages, opened.board] };
}

/** First-fit across existing pages, spilling onto a new page once every existing one is full. */
export function placeAutoLayout(ctx: InitialPlacementCtx, entries: readonly InitialLayoutTile[]): AutoLayoutResult {
  let progress: AutoLayoutResult = { state: ctx.config.engine.empty(), pages: [boardId('default')] };
  for (const entry of entries) progress = placeOne(ctx, progress, entry);
  return progress;
}
