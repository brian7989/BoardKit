import { rectOfTile, type Rect } from '../../../shared/geometry/Rect.js';
import type { Cell } from '../../../shared/units/Cell.js';
import type { Move } from '../../search/SearchProblem.js';
import { generateRelocationCandidates, type RelocationCandidate } from './generateRelocationCandidates.js';
import { orderRelocationCandidates } from './orderRelocationCandidates.js';
import { TILES_MOVED_WEIGHT, DISTANCE_WEIGHT } from './relocationCostOf.js';
import type { RelocationBoard } from './RelocationBoard.js';
import type { RelocationState } from './RelocationState.js';

// Candidates are sorted up front (cheap: rects and numbers only), but each child's mutation
// and state object are built only for a move that survives the caller's bound check.
export function relocationChildren(state: RelocationState): readonly Move<RelocationState>[] {
  const { board } = state;
  const headIndex = board.queue[board.head];
  const tile = headIndex === undefined ? undefined : board.tiles[headIndex];
  const size = headIndex === undefined ? undefined : board.size[headIndex];
  if (headIndex === undefined || !tile || !size) return [];
  const original = rectOfTile({ x: tile.col, y: tile.row }, size);
  const raw = generateRelocationCandidates({ board, headIndex, size, original, order: board.order });
  return orderRelocationCandidates(raw).map((candidate) => toMove({ board, headIndex, parent: state, candidate }));
}

interface ToMoveInput {
  readonly board: RelocationBoard;
  readonly headIndex: number;
  readonly parent: RelocationState;
  readonly candidate: RelocationCandidate;
}

function toMove(input: ToMoveInput): Move<RelocationState> {
  const { board, headIndex, parent, candidate } = input;
  const remaining = parent.remaining - 1 + candidate.newlyBlocked.length;
  const tilesMoved = parent.tilesMoved + 1;
  const totalDistance = parent.totalDistance + candidate.distance;
  const directionPenalty = parent.directionPenalty + candidate.rank;
  const cost = tilesMoved * TILES_MOVED_WEIGHT + totalDistance * DISTANCE_WEIGHT + directionPenalty;
  return {
    bound: cost + remaining * TILES_MOVED_WEIGHT,
    enter: () => {
      applyCandidate(board, headIndex, candidate);
      return { board, remaining, tilesMoved, totalDistance, directionPenalty };
    },
    exit: () => undoCandidate(board, headIndex, candidate),
  };
}

function applyCandidate(board: RelocationBoard, headIndex: number, candidate: RelocationCandidate): void {
  board.head += 1;
  board.placedRect[headIndex] = candidate.rect;
  setBlockedCells(board, candidate.rect, 1);
  for (const index of candidate.newlyBlocked) {
    board.resolved[index] = 1;
    board.queue.push(index);
  }
}

function undoCandidate(board: RelocationBoard, headIndex: number, candidate: RelocationCandidate): void {
  board.queue.length -= candidate.newlyBlocked.length;
  for (const index of candidate.newlyBlocked) board.resolved[index] = 0;
  setBlockedCells(board, candidate.rect, 0);
  board.placedRect[headIndex] = null;
  board.head -= 1;
}

function setBlockedCells(board: RelocationBoard, rect: Rect<Cell>, value: number): void {
  for (let row: number = rect.y; row < rect.y + rect.h; row += 1) {
    for (let col: number = rect.x; col < rect.x + rect.w; col += 1) board.blocked[row * board.cols + col] = value;
  }
}

