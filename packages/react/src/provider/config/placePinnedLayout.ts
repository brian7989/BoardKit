import { boardId, OpType, type BoardId, type BoardsState } from 'boardkit-core';
import type { InitialLayoutTile } from './InitialLayoutTile.js';
import type { InitialPlacementCtx } from './InitialPlacementCtx.js';
import { resolveInitialTile, type ResolvedInitialTile } from './resolveInitialTile.js';
import { addResolvedTile } from './addResolvedTile.js';
import { toPoint } from './toPoint.js';

interface PinnedProgress {
  readonly state: BoardsState;
  readonly boards: ReadonlyMap<number, BoardId>;
}

interface EnsurePageInput {
  readonly ctx: InitialPlacementCtx;
  readonly progress: PinnedProgress;
  readonly page: number;
  readonly baseIndex: number;
}

// Extra pages are numbered right after the automatic ones, so they land after the "showcase".
function ensurePage(input: EnsurePageInput): PinnedProgress {
  const { ctx, progress, page, baseIndex } = input;
  if (progress.boards.has(page)) return progress;
  const board = boardId(`page-${baseIndex + page}`);
  const opened = ctx.config.engine.apply(progress.state, { type: OpType.AddBoard, board });
  if (!opened.ok) return progress;
  return { state: opened.value.state, boards: new Map(progress.boards).set(page, board) };
}

interface PlacementAttempt {
  readonly ctx: InitialPlacementCtx;
  readonly state: BoardsState;
  readonly board: BoardId;
  readonly entry: InitialLayoutTile;
  readonly resolved: ResolvedInitialTile;
}

type AddAttempt = ReturnType<typeof addResolvedTile>;

function placeFloatingEntry(input: PlacementAttempt): AddAttempt {
  const { ctx, state, board, resolved } = input;
  return addResolvedTile({ config: ctx.config, state, board, resolved });
}

// No spillover here, unlike the automatic pages: an explicit page that's full just drops the entry.
function placeGridEntry(input: PlacementAttempt): AddAttempt | null {
  const { ctx, state, board, entry, resolved } = input;
  const at = entry.at ? toPoint(entry.at) : (ctx.config.engine.findFree(state, board, resolved.size) ?? undefined);
  if (!at) return null;
  return addResolvedTile({ config: ctx.config, state, board, resolved, at });
}

interface PlaceEntryInput {
  readonly ctx: InitialPlacementCtx;
  readonly progress: PinnedProgress;
  readonly entry: InitialLayoutTile;
  readonly baseIndex: number;
}

function placeEntry(input: PlaceEntryInput): PinnedProgress {
  const { ctx, entry, baseIndex } = input;
  const page = entry.page ?? 0;
  const opened = ensurePage({ ctx, progress: input.progress, page, baseIndex });
  const board = opened.boards.get(page);
  const resolved = board ? resolveInitialTile(ctx, entry) : null;
  if (!board || !resolved) return opened;
  const attemptInput: PlacementAttempt = { ctx, state: opened.state, board, entry, resolved };
  const attempt = resolved.float ? placeFloatingEntry(attemptInput) : placeGridEntry(attemptInput);
  if (!attempt || !attempt.ok) return opened;
  return { state: attempt.value.state, boards: opened.boards };
}

export interface PlacePinnedInput {
  readonly ctx: InitialPlacementCtx;
  readonly entries: readonly InitialLayoutTile[];
  readonly state: BoardsState;
  readonly baseIndex: number;
}

/** Places every entry that names an explicit `page`, on extra pages created after the automatic ones. */
export function placePinnedLayout(input: PlacePinnedInput): BoardsState {
  const { ctx, entries, state, baseIndex } = input;
  let progress: PinnedProgress = { state, boards: new Map() };
  for (const entry of entries) progress = placeEntry({ ctx, progress, entry, baseIndex });
  return progress.state;
}
