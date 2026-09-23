import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { relocateTiles } from './relocateTiles.js';
import { exceedsCapacity } from './exceedsCapacity.js';
import { findDisplaced } from './occupancy/findDisplaced.js';
import { toRelocation } from './toRelocation.js';
import { moveCost } from './cost/moveCost.js';
import { Direction } from './cost/Direction.js';
import { rectOfTile, rectsIntersect, type Rect } from '../../shared/geometry/Rect.js';
import { cell, type Cell } from '../../shared/units/Cell.js';
import { tileId, type TileId } from '../../shared/ids/TileId.js';
import { SearchStatus } from '../search/SearchStatus.js';
import type { SearchOutcome } from '../search/SearchOutcome.js';
import type { Size } from '../../shared/sizes/Size.js';
import type { Tile } from '../../model/Tile.js';
import type { RelocationInput } from './RelocationInput.js';
import type { Relocation } from './Relocation.js';

// --- Pre-refactor implementation (from before the mutable-board / lazy / memoized rewrite),
// kept only so this test can prove the rewrite produces identical results. Not for reuse.

interface OldOccupancyGrid {
  readonly cols: number;
  readonly rows: number;
  readonly owner: ReadonlyArray<ReadonlyArray<TileId | null>>;
  readonly pinned: Rect<Cell>;
}

function oldBuildOccupancy(input: RelocationInput): OldOccupancyGrid {
  const owner: (TileId | null)[][] = Array.from({ length: input.grid.rows }, () => Array.from({ length: input.grid.cols }, () => null));
  for (const tile of input.tiles) {
    if (tile.id === input.pinnedTileId) continue;
    oldMarkTile(owner, rectOfTile({ x: tile.col, y: tile.row }, input.sizeOf(tile)), tile.id);
  }
  return { cols: input.grid.cols, rows: input.grid.rows, owner, pinned: input.pinnedRect };
}

function oldMarkTile(owner: (TileId | null)[][], rect: Rect<Cell>, id: TileId): void {
  for (let row: number = rect.y; row < rect.y + rect.h; row += 1) {
    const line = owner[row];
    if (!line) continue;
    for (let col: number = rect.x; col < rect.x + rect.w; col += 1) line[col] = id;
  }
}

interface OldCandidate {
  readonly rect: Rect<Cell>;
  readonly newlyBlocked: readonly TileId[];
}

interface OldGenerateInput {
  readonly tileId: TileId;
  readonly size: Size;
  readonly occupancy: OldOccupancyGrid;
  readonly placed: ReadonlyMap<TileId, Rect<Cell>>;
  readonly resolved: ReadonlySet<TileId>;
}

function oldGenerateCandidates(input: OldGenerateInput): readonly OldCandidate[] {
  const maxX = input.occupancy.cols - input.size.w;
  const maxY = input.occupancy.rows - input.size.h;
  const candidates: OldCandidate[] = [];
  for (let y = 0; y <= maxY; y += 1) candidates.push(...oldCandidatesForRow(y, maxX, input));
  return candidates;
}

function oldCandidatesForRow(y: number, maxX: number, input: OldGenerateInput): readonly OldCandidate[] {
  const candidates: OldCandidate[] = [];
  for (let x = 0; x <= maxX; x += 1) {
    const rect: Rect<Cell> = { x: cell(x), y: cell(y), w: input.size.w, h: input.size.h };
    const candidate = oldEvaluateCandidate(rect, input);
    if (candidate) candidates.push(candidate);
  }
  return candidates;
}

function oldEvaluateCandidate(rect: Rect<Cell>, input: OldGenerateInput): OldCandidate | null {
  if (rectsIntersect(rect, input.occupancy.pinned)) return null;
  for (const placedRect of input.placed.values()) {
    if (rectsIntersect(rect, placedRect)) return null;
  }
  return { rect, newlyBlocked: oldNewlyBlocked(rect, input) };
}

interface OldCollectCtx {
  readonly rect: Rect<Cell>;
  readonly input: OldGenerateInput;
  readonly found: Set<TileId>;
}

function oldNewlyBlocked(rect: Rect<Cell>, input: OldGenerateInput): readonly TileId[] {
  const ctx: OldCollectCtx = { rect, input, found: new Set() };
  for (let row: number = rect.y; row < rect.y + rect.h; row += 1) oldCollectRow(ctx, row);
  return Array.from(ctx.found);
}

function oldCollectRow(ctx: OldCollectCtx, row: number): void {
  const { rect, input, found } = ctx;
  const line = input.occupancy.owner[row];
  if (!line) return;
  for (let col: number = rect.x; col < rect.x + rect.w; col += 1) {
    const owner = line[col];
    if (owner && owner !== input.tileId && !input.resolved.has(owner)) found.add(owner);
  }
}

function oldOrderCandidates(candidates: readonly OldCandidate[], original: Rect<Cell>, order: readonly Direction[]): readonly OldCandidate[] {
  return candidates
    .map((candidate) => ({ candidate, cost: moveCost(original, candidate.rect, order) }))
    .sort(
      (a, b) =>
        a.candidate.newlyBlocked.length - b.candidate.newlyBlocked.length ||
        a.cost.distance - b.cost.distance ||
        a.cost.rank - b.cost.rank ||
        a.candidate.rect.y - b.candidate.rect.y ||
        a.candidate.rect.x - b.candidate.rect.x,
    )
    .map((entry) => entry.candidate);
}

interface OldRelocationState {
  readonly placed: ReadonlyMap<TileId, Rect<Cell>>;
  readonly queue: readonly TileId[];
  readonly resolved: ReadonlySet<TileId>;
  readonly tilesMoved: number;
  readonly totalDistance: number;
  readonly directionPenalty: number;
}

const OLD_TILES_MOVED_WEIGHT = 1_000_000;
const OLD_DISTANCE_WEIGHT = 10;

function oldCostOf(state: OldRelocationState): number {
  return state.tilesMoved * OLD_TILES_MOVED_WEIGHT + state.totalDistance * OLD_DISTANCE_WEIGHT + state.directionPenalty;
}

function oldLowerBound(state: OldRelocationState): number {
  return oldCostOf(state) + state.queue.length * OLD_TILES_MOVED_WEIGHT;
}

interface OldContext {
  readonly input: RelocationInput;
  readonly occupancy: OldOccupancyGrid;
  readonly tilesById: ReadonlyMap<TileId, Tile>;
}

function oldSuccessorsOf(ctx: OldContext, state: OldRelocationState): readonly OldRelocationState[] {
  const [headId, ...rest] = state.queue;
  const tile = headId && ctx.tilesById.get(headId);
  if (!headId || !tile) return [];
  const size = ctx.input.sizeOf(tile);
  const original = rectOfTile({ x: tile.col, y: tile.row }, size);
  const candidates = oldGenerateCandidates({ tileId: headId, size, occupancy: ctx.occupancy, placed: state.placed, resolved: state.resolved });
  const ordered = oldOrderCandidates(candidates, original, ctx.input.options.directions);
  return ordered.map((candidate) => oldApplyCandidate({ ctx, state, rest, headId, original, candidate }));
}

interface OldApplyInput {
  readonly ctx: OldContext;
  readonly state: OldRelocationState;
  readonly rest: readonly TileId[];
  readonly headId: TileId;
  readonly original: Rect<Cell>;
  readonly candidate: OldCandidate;
}

function oldApplyCandidate(input: OldApplyInput): OldRelocationState {
  const { ctx, state, rest, headId, original, candidate } = input;
  const cost = moveCost(original, candidate.rect, ctx.input.options.directions);
  const resolved = new Set(state.resolved);
  for (const id of candidate.newlyBlocked) resolved.add(id);
  return {
    placed: new Map(state.placed).set(headId, candidate.rect),
    queue: [...rest, ...candidate.newlyBlocked],
    resolved,
    tilesMoved: state.tilesMoved + 1,
    totalDistance: state.totalDistance + cost.distance,
    directionPenalty: state.directionPenalty + cost.rank,
  };
}

interface OldBudget {
  nodes: number;
  best: { state: OldRelocationState; cost: number } | null;
  budgetExhausted: boolean;
  readonly maxNodes: number;
}

function oldBranchAndBound(ctx: OldContext, displaced: readonly TileId[], maxNodes: number): SearchOutcome<OldRelocationState> {
  const initial: OldRelocationState = { placed: new Map(), queue: displaced, resolved: new Set(displaced), tilesMoved: 0, totalDistance: 0, directionPenalty: 0 };
  const budget: OldBudget = { nodes: 0, best: null, budgetExhausted: false, maxNodes };
  oldExplore(ctx, budget, initial);
  if (budget.best) return { status: SearchStatus.Solved, solution: budget.best.state };
  return { status: budget.budgetExhausted ? SearchStatus.BudgetExhausted : SearchStatus.None };
}

function oldExplore(ctx: OldContext, budget: OldBudget, state: OldRelocationState): void {
  if (budget.nodes >= budget.maxNodes) {
    budget.budgetExhausted = true;
    return;
  }
  budget.nodes += 1;
  const cost = oldCostOf(state);
  const bound = oldLowerBound(state);
  if (budget.best !== null && bound > budget.best.cost) return;
  if (state.queue.length === 0) {
    if (!budget.best || cost < budget.best.cost) budget.best = { state, cost };
    return;
  }
  for (const next of oldSuccessorsOf(ctx, state)) {
    if (budget.best === null || oldLowerBound(next) <= budget.best.cost) oldExplore(ctx, budget, next);
  }
}

function oldRelocateTiles(input: RelocationInput): Relocation {
  const shared = { tiles: input.tiles, pinnedTileId: input.pinnedTileId, pinnedRect: input.pinnedRect, sizeOf: input.sizeOf };
  const displaced = findDisplaced(shared);
  if (exceedsCapacity(input)) return { ok: false, error: { blockedBy: displaced } };
  const occupancy = oldBuildOccupancy(input);
  const tilesById = new Map(input.tiles.map((tile) => [tile.id, tile]));
  const outcome = oldBranchAndBound({ input, occupancy, tilesById }, displaced, input.options.maxNodes);
  return toRelocation(outcome, displaced);
}

// --- The equivalence test.

function makeTile(index: number, col: number, row: number): Tile {
  return { id: tileId(`t${index}`), col: cell(col), row: cell(row), size: { w: cell(1), h: cell(1) }, items: [], active: 0 };
}

const PINNED_SIZES = [
  { w: 1, h: 1 },
  { w: 2, h: 1 },
  { w: 1, h: 2 },
  { w: 2, h: 2 },
];

const fixtureArb = fc
  .record({ cols: fc.integer({ min: 3, max: 6 }), rows: fc.integer({ min: 3, max: 6 }) })
  .chain((grid) => {
    const cellArb = fc.record({ col: fc.integer({ min: 0, max: grid.cols - 1 }), row: fc.integer({ min: 0, max: grid.rows - 1 }) });
    const cellsArb = fc.uniqueArray(cellArb, { maxLength: grid.cols * grid.rows - 1, selector: (c) => `${c.col},${c.row}` });
    const pinnedSizeArb = fc.constantFrom(...PINNED_SIZES);
    return fc.tuple(fc.constant(grid), cellsArb, pinnedSizeArb);
  })
  .chain(([grid, cells, pinnedSize]) => {
    const pinnedArb = fc.record({
      x: fc.integer({ min: 0, max: Math.max(grid.cols - pinnedSize.w, 0) }),
      y: fc.integer({ min: 0, max: Math.max(grid.rows - pinnedSize.h, 0) }),
    });
    return fc.record({ grid: fc.constant(grid), cells: fc.constant(cells), pinnedSize: fc.constant(pinnedSize), pinned: pinnedArb });
  });

interface Fixture {
  readonly grid: { readonly cols: number; readonly rows: number };
  readonly cells: readonly { readonly col: number; readonly row: number }[];
  readonly pinnedSize: { readonly w: number; readonly h: number };
  readonly pinned: { readonly x: number; readonly y: number };
}

function toInput(fixture: Fixture): RelocationInput {
  return {
    tiles: fixture.cells.map((c, index) => makeTile(index, c.col, c.row)),
    pinnedTileId: tileId('pinned'),
    pinnedRect: { x: cell(fixture.pinned.x), y: cell(fixture.pinned.y), w: cell(fixture.pinnedSize.w), h: cell(fixture.pinnedSize.h) },
    grid: { cols: fixture.grid.cols, rows: fixture.grid.rows },
    sizeOf: (tile) => tile.size,
    options: { maxNodes: 20_000, directions: [Direction.Down, Direction.Right, Direction.Up, Direction.Left], nudgeOnResize: true },
  };
}

describe('relocateTiles equivalence', () => {
  it('matches the pre-rewrite branch-and-bound search on 200 random boards', () => {
    fc.assert(
      fc.property(fixtureArb, (fixture) => {
        const input = toInput(fixture);
        expect(relocateTiles(input)).toEqual(oldRelocateTiles(input));
      }),
      { numRuns: 200 },
    );
  });
});
