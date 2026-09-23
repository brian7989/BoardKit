// One child: `bound` is a cheap pre-check computable before `enter` builds the child state;
// `exit` undoes it, so siblings can share one mutable structure instead of copying it.
export interface Move<S> {
  readonly bound: number;
  enter(): S;
  exit(): void;
}

export interface SearchProblem<S> {
  readonly initial: S;
  isGoal(state: S): boolean;
  costOf(state: S): number;
  // Visited-state key for transposition dedup; states sharing a key are equivalent, so once
  // one is explored the rest can be skipped. Omit to explore every reachable state.
  hash?(state: S): number | string;
  // Freezes anything `state` merely references into an independent value, for when it becomes
  // the new best; defaults to `state` itself.
  snapshot?(state: S): S;
  children(state: S): Iterable<Move<S>>;
}
