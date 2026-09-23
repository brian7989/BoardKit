import type { RelocationCandidate } from './generateRelocationCandidates.js';

// Fewer newly-blocked tiles first (keeps the chain short), then shortest move, then the
// preferred push direction, then position, for full determinism.
export function orderRelocationCandidates(candidates: readonly RelocationCandidate[]): readonly RelocationCandidate[] {
  return candidates.slice().sort(compareCandidates);
}

function compareCandidates(a: RelocationCandidate, b: RelocationCandidate): number {
  return (
    a.newlyBlocked.length - b.newlyBlocked.length ||
    a.distance - b.distance ||
    a.rank - b.rank ||
    a.rect.y - b.rect.y ||
    a.rect.x - b.rect.x
  );
}
