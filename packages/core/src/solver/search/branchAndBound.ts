import type { Move, SearchProblem } from './SearchProblem.js';
import type { SearchOutcome } from './SearchOutcome.js';
import { SearchStatus } from './SearchStatus.js';
import type { TraceFn } from './TraceFn.js';

interface SearchOptions<S> {
  readonly maxNodes: number;
  readonly trace?: TraceFn<S>;
}

interface SearchBudget<S> {
  nodes: number;
  best: { state: S; cost: number } | null;
  budgetExhausted: boolean;
  readonly visited: Set<number | string>;
}

interface ExploreContext<S> {
  readonly problem: SearchProblem<S>;
  readonly opts: SearchOptions<S>;
  readonly budget: SearchBudget<S>;
}

export function branchAndBound<S>(problem: SearchProblem<S>, opts: SearchOptions<S>): SearchOutcome<S> {
  const budget: SearchBudget<S> = { nodes: 0, best: null, budgetExhausted: false, visited: new Set() };
  explore({ problem, opts, budget }, problem.initial);
  if (budget.best) return { status: SearchStatus.Solved, solution: budget.best.state };
  return { status: budget.budgetExhausted ? SearchStatus.BudgetExhausted : SearchStatus.None };
}

// Pruning happens where a child's move is offered (visitChildren): a state already known to
// lose never gets entered, so there is no separate bound check to repeat here.
function explore<S>(ctx: ExploreContext<S>, state: S): void {
  const { problem, opts, budget } = ctx;
  if (alreadyVisited(problem, budget, state) || overBudget(budget, opts)) return;
  budget.nodes += 1;
  const cost = problem.costOf(state);
  opts.trace?.({ node: state, cost });
  if (problem.isGoal(state)) {
    recordSolution(problem, budget, { state, cost });
    return;
  }
  visitChildren(ctx, problem.children(state));
}

// A child whose own bound already loses to the best is never entered (or counted).
function visitChildren<S>(ctx: ExploreContext<S>, moves: Iterable<Move<S>>): void {
  for (const move of moves) {
    if (isPrunable(ctx.budget, move.bound)) continue;
    const child = move.enter();
    explore(ctx, child);
    move.exit();
  }
}

function alreadyVisited<S>(problem: SearchProblem<S>, budget: SearchBudget<S>, state: S): boolean {
  if (!problem.hash) return false;
  const key = problem.hash(state);
  if (budget.visited.has(key)) return true;
  budget.visited.add(key);
  return false;
}

function overBudget<S>(budget: SearchBudget<S>, opts: SearchOptions<S>): boolean {
  if (budget.nodes < opts.maxNodes) return false;
  budget.budgetExhausted = true;
  return true;
}

function isPrunable<S>(budget: SearchBudget<S>, bound: number): boolean {
  return budget.best !== null && bound > budget.best.cost;
}

function recordSolution<S>(problem: SearchProblem<S>, budget: SearchBudget<S>, found: { state: S; cost: number }): void {
  if (budget.best && found.cost >= budget.best.cost) return;
  budget.best = { state: problem.snapshot ? problem.snapshot(found.state) : found.state, cost: found.cost };
}
