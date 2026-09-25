import { boardId, OpType, type BoardId, type BoardsState } from 'boardkit-core';
import type { InitialPlacementCtx } from './InitialPlacementCtx.js';
import type { ResolvedInitialTile } from './resolveInitialTile.js';
import { addResolvedTile } from './addResolvedTile.js';

/** A layout being built: its state so far, and the pages first-fit may use, in order. */
export interface PageProgress {
  readonly state: BoardsState;
  readonly pages: readonly BoardId[];
}

function firstFit(ctx: InitialPlacementCtx, progress: PageProgress, resolved: ResolvedInitialTile): BoardsState | null {
  for (const board of progress.pages) {
    const attempt = addResolvedTile({ config: ctx.config, state: progress.state, board, resolved });
    if (attempt.ok) return attempt.value.state;
  }
  return null;
}

function openNextPage(ctx: InitialPlacementCtx, progress: PageProgress): { readonly state: BoardsState; readonly board: BoardId } | null {
  const board = boardId(`page-${progress.pages.length}`);
  const opened = ctx.config.engine.apply(progress.state, { type: OpType.AddBoard, board });
  return opened.ok ? { state: opened.value.state, board } : null;
}

/** The first page with room, else a new page; the tile is dropped only if even a fresh page can't hold it. */
export function placeFirstFit(ctx: InitialPlacementCtx, progress: PageProgress, resolved: ResolvedInitialTile): PageProgress {
  const fitState = firstFit(ctx, progress, resolved);
  if (fitState) return { state: fitState, pages: progress.pages };
  const opened = openNextPage(ctx, progress);
  if (!opened) return progress;
  const attempt = addResolvedTile({ config: ctx.config, state: opened.state, board: opened.board, resolved });
  if (!attempt.ok) return progress;
  return { state: attempt.value.state, pages: [...progress.pages, opened.board] };
}
