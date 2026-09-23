import { describe, expect, it } from 'vitest';
import { branchAndBound } from './branchAndBound.js';
import { SearchStatus } from './SearchStatus.js';
import type { SearchProblem } from './SearchProblem.js';

// A tiny counting problem, exercising the search shape without the grid domain.
function countingProblem(target: number): SearchProblem<number> {
  return {
    initial: 0,
    isGoal: (state) => state === target,
    costOf: (state) => state,
    *children(state) {
      if (state < target) yield { bound: state + 1, enter: () => state + 1, exit: () => {} };
    },
  };
}

describe('branchAndBound', () => {
  it('finds the goal when the budget is enough', () => {
    const outcome = branchAndBound(countingProblem(3), { maxNodes: 100 });
    expect(outcome).toEqual({ status: SearchStatus.Solved, solution: 3 });
  });

  it('reports BudgetExhausted when the node budget runs out before finding a goal', () => {
    const outcome = branchAndBound(countingProblem(1000), { maxNodes: 5 });
    expect(outcome).toEqual({ status: SearchStatus.BudgetExhausted });
  });

  it('reports None when the search space is exhausted without ever reaching a goal', () => {
    const unreachable: SearchProblem<number> = { initial: 0, isGoal: () => false, costOf: (state) => state, children: () => [] };
    const outcome = branchAndBound(unreachable, { maxNodes: 100 });
    expect(outcome).toEqual({ status: SearchStatus.None });
  });

  it('prunes a child whose bound already exceeds the best solution found so far', () => {
    const trace: number[] = [];
    // Two branches from the root: a cheap one that solves immediately, and an expensive one
    // whose bound (100) should be pruned before it (or its own successor, 101) is ever entered.
    const problem: SearchProblem<number> = {
      initial: 0,
      isGoal: (state) => state === 1 || state === 100,
      costOf: (state) => state,
      *children(state) {
        if (state === 0) {
          yield { bound: 1, enter: () => 1, exit: () => {} };
          yield { bound: 100, enter: () => 100, exit: () => {} };
        }
        if (state === 100) yield { bound: 101, enter: () => 101, exit: () => {} };
      },
    };
    const outcome = branchAndBound(problem, { maxNodes: 100, trace: (event) => trace.push(event.node) });

    expect(outcome).toEqual({ status: SearchStatus.Solved, solution: 1 });
    expect(trace).toEqual([0, 1]);
  });

  it('never enters a child whose bound already loses, avoiding the cost of building it', () => {
    let entered = 0;
    const problem: SearchProblem<number> = {
      initial: 0,
      isGoal: (state) => state === 1 || state === 50,
      costOf: (state) => state,
      *children(state) {
        if (state !== 0) return;
        yield {
          bound: 1,
          enter: () => {
            entered += 1;
            return 1;
          },
          exit: () => {},
        };
        yield {
          bound: 50,
          enter: () => {
            entered += 1;
            return 50;
          },
          exit: () => {},
        };
      },
    };
    branchAndBound(problem, { maxNodes: 100 });
    expect(entered).toBe(1);
  });

  it('keeps the lower-cost solution when more than one goal is reachable', () => {
    const problem: SearchProblem<number> = {
      initial: 0,
      isGoal: (state) => state === 5 || state === 2,
      costOf: (state) => state,
      *children(state) {
        if (state === 0) {
          yield { bound: 5, enter: () => 5, exit: () => {} };
          yield { bound: 2, enter: () => 2, exit: () => {} };
        }
      },
    };
    const outcome = branchAndBound(problem, { maxNodes: 100 });
    expect(outcome).toEqual({ status: SearchStatus.Solved, solution: 2 });
  });

  it('explores a state reached via two different paths only once when hash is provided', () => {
    const trace: number[] = [];
    // A diamond: 0 -> 1 -> 3 and 0 -> 2 -> 3. The second arrival at 3 shares its hash with the
    // first and is skipped, even though its bound alone would not have pruned it.
    const problem: SearchProblem<number> = {
      initial: 0,
      isGoal: (state) => state === 3,
      costOf: (state) => state,
      hash: (state) => state,
      *children(state) {
        if (state === 0) {
          yield { bound: 1, enter: () => 1, exit: () => {} };
          yield { bound: 2, enter: () => 2, exit: () => {} };
        }
        if (state === 1 || state === 2) yield { bound: 3, enter: () => 3, exit: () => {} };
      },
    };
    const outcome = branchAndBound(problem, { maxNodes: 100, trace: (event) => trace.push(event.node) });

    expect(outcome).toEqual({ status: SearchStatus.Solved, solution: 3 });
    expect(trace.filter((node) => node === 3)).toHaveLength(1);
  });

  it('freezes the winning state via snapshot before backtracking undoes the shared mutation', () => {
    const shared = { value: 0 };
    const problem: SearchProblem<{ shared: typeof shared }> = {
      initial: { shared },
      isGoal: (state) => state.shared.value === 1,
      costOf: (state) => state.shared.value,
      snapshot: (state) => ({ shared: { value: state.shared.value } }),
      *children(state) {
        if (state.shared.value !== 0) return;
        yield {
          bound: 1,
          enter: () => {
            shared.value = 1;
            return state;
          },
          exit: () => {
            shared.value = 0;
          },
        };
      },
    };
    const outcome = branchAndBound(problem, { maxNodes: 10 });
    expect(outcome).toEqual({ status: SearchStatus.Solved, solution: { shared: { value: 1 } } });
  });
});
