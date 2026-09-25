import { boardId } from 'boardkit-core';
import type { InitialPlacementCtx } from './InitialPlacementCtx.js';
import type { ResolvedEntry } from './resolveEntries.js';
import { addResolvedTile } from './addResolvedTile.js';
import { placeFirstFit, type PageProgress } from './placeFirstFit.js';
import { toPoint } from './toPoint.js';

export type AutoLayoutResult = PageProgress;

const DEFAULT_PAGE = boardId('default');

function isPinned(item: ResolvedEntry): boolean {
  return item.entry.at !== undefined && !item.resolved.float;
}

// An authored spot is taken only if it's free: pushing an earlier pinned tile aside would move it
// off its own authored spot, so a clash falls back to first-fit instead.
function placeAtSpot(ctx: InitialPlacementCtx, progress: PageProgress, item: ResolvedEntry): PageProgress | null {
  if (!item.entry.at) return null;
  const at = toPoint(item.entry.at);
  const attempt = addResolvedTile({ config: ctx.config, state: progress.state, board: DEFAULT_PAGE, resolved: item.resolved, at });
  if (!attempt.ok || attempt.value.changes.length > 1) return null;
  return { state: attempt.value.state, pages: progress.pages };
}

/** Entries with `at` go first, at exactly that cell on the first page; the rest then first-fit, spilling onto new pages. */
export function placeAutoLayout(ctx: InitialPlacementCtx, entries: readonly ResolvedEntry[]): AutoLayoutResult {
  let progress: PageProgress = { state: ctx.config.engine.empty(), pages: [DEFAULT_PAGE] };
  const unplaced: ResolvedEntry[] = [];
  for (const item of entries.filter(isPinned)) {
    const placed = placeAtSpot(ctx, progress, item);
    if (placed) progress = placed;
    else unplaced.push(item);
  }
  const rest = [...unplaced, ...entries.filter((candidate) => !isPinned(candidate))];
  for (const item of rest) progress = placeFirstFit(ctx, progress, item.resolved);
  return progress;
}
