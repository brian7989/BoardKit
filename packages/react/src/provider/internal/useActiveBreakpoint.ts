import { useCallback, useRef, useState } from 'react';
import type { BoardsState } from 'boardkit-core';
import { ChangeReason } from '../ChangeReason.js';
import type { ResolvedBreakpoint } from '../config/ResolvedBreakpoint.js';
import { pickBreakpoint } from '../config/pickBreakpoint.js';
import type { CommitBoardsState } from './useControllableBoardsState.js';

export interface UseActiveBreakpointInput {
  readonly breakpoints: readonly ResolvedBreakpoint[];
  readonly getState: () => BoardsState;
  readonly commit: CommitBoardsState;
}

export interface ActiveBreakpoint {
  readonly grid: ResolvedBreakpoint['grid'];
  readonly engine: ResolvedBreakpoint['engine'];
  // <Board> calls this with its measured container width; a breakpoint change reflows and commits.
  readonly reportWidth: (width: number) => void;
}

function initialWidth(): number {
  return typeof window === 'undefined' ? 0 : window.innerWidth;
}

function sameGrid(a: ResolvedBreakpoint['grid'], b: BoardsState['grid']): boolean {
  return a.cols === b.cols && a.rows === b.rows;
}

// Chosen synchronously, before <Board> measures: the incoming state's own grid wins when a
// breakpoint matches it, and the viewport width is only a fallback for a fresh, gridless state.
function initialBreakpoint(breakpoints: readonly ResolvedBreakpoint[], state: BoardsState): ResolvedBreakpoint {
  const matching = breakpoints.find((bp) => sameGrid(bp.grid, state.grid));
  return matching ?? pickBreakpoint(breakpoints, initialWidth());
}

export function useActiveBreakpoint(input: UseActiveBreakpointInput): ActiveBreakpoint {
  const { breakpoints, getState, commit } = input;
  const [active, setActive] = useState(() => initialBreakpoint(breakpoints, getState()));
  const activeRef = useRef(active);
  activeRef.current = active;

  const reportWidth = useCallback(
    (width: number) => {
      const next = pickBreakpoint(breakpoints, width);
      if (next === activeRef.current) return;
      const result = next.engine.reflow(getState());
      commit(result.state, { reason: ChangeReason.Reflow, changes: result.changes });
      setActive(next);
    },
    [breakpoints, getState, commit],
  );

  return { grid: active.grid, engine: active.engine, reportWidth };
}
