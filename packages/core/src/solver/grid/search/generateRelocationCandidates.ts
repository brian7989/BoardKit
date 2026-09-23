import { cell, type Cell } from '../../../shared/units/Cell.js';
import type { Rect } from '../../../shared/geometry/Rect.js';
import type { Size } from '../../../shared/sizes/Size.js';
import { moveCost } from '../cost/moveCost.js';
import type { Direction } from '../cost/Direction.js';
import type { RelocationBoard } from './RelocationBoard.js';

export interface RelocationCandidate {
  readonly rect: Rect<Cell>;
  readonly newlyBlocked: readonly number[];
  readonly distance: number;
  readonly rank: number;
}

export interface GenerateCandidatesInput {
  readonly board: RelocationBoard;
  readonly headIndex: number;
  readonly size: Size;
  readonly original: Rect<Cell>;
  readonly order: readonly Direction[];
}

// Pinned+placed occupancy lives on a mutable typed array, so checking a position is a handful
// of array reads instead of a scan over every already-placed tile's rect.
export function generateRelocationCandidates(input: GenerateCandidatesInput): readonly RelocationCandidate[] {
  const maxX = input.board.cols - input.size.w;
  const maxY = input.board.rows - input.size.h;
  const candidates: RelocationCandidate[] = [];
  for (let y = 0; y <= maxY; y += 1) candidates.push(...candidatesForRow(y, maxX, input));
  return candidates;
}

function candidatesForRow(y: number, maxX: number, input: GenerateCandidatesInput): readonly RelocationCandidate[] {
  const candidates: RelocationCandidate[] = [];
  for (let x = 0; x <= maxX; x += 1) {
    const candidate = evaluateCandidate(input, { x: cell(x), y: cell(y), w: input.size.w, h: input.size.h });
    if (candidate) candidates.push(candidate);
  }
  return candidates;
}

function evaluateCandidate(input: GenerateCandidatesInput, rect: Rect<Cell>): RelocationCandidate | null {
  const newlyBlocked = scanRect(input.board, rect, input.headIndex);
  if (!newlyBlocked) return null;
  const cost = moveCost(input.original, rect, input.order);
  return { rect, newlyBlocked, distance: cost.distance, rank: cost.rank };
}

interface ScanContext {
  readonly board: RelocationBoard;
  readonly rect: Rect<Cell>;
  readonly selfIndex: number;
  readonly found: number[];
  blocked: boolean;
}

// One pass per rect: bails out (returns null) the moment a cell is pinned or already placed,
// otherwise collects the distinct still-unresolved tiles the rect would newly cover.
function scanRect(board: RelocationBoard, rect: Rect<Cell>, selfIndex: number): readonly number[] | null {
  const ctx: ScanContext = { board, rect, selfIndex, found: [], blocked: false };
  for (let row: number = rect.y; row < rect.y + rect.h && !ctx.blocked; row += 1) scanRow(ctx, row);
  return ctx.blocked ? null : ctx.found;
}

function scanRow(ctx: ScanContext, row: number): void {
  const { board, rect } = ctx;
  for (let col: number = rect.x; col < rect.x + rect.w; col += 1) {
    if (scanCell(ctx, row * board.cols + col)) return;
  }
}

function scanCell(ctx: ScanContext, index: number): boolean {
  if (ctx.board.blocked[index]) {
    ctx.blocked = true;
    return true;
  }
  const owner = (ctx.board.owner[index] ?? 0) - 1;
  if (owner >= 0 && owner !== ctx.selfIndex && !ctx.board.resolved[owner] && !ctx.found.includes(owner)) ctx.found.push(owner);
  return false;
}
