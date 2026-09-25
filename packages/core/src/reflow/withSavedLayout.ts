import { markValid, type BoardsState } from '../model/index.js';
import { gridKey } from './gridKey.js';
import { snapshotLayout } from './snapshotLayout.js';

/** Saves `from`'s arrangement as `state`'s remembered layout for `from`'s grid; a later reflow onto that grid restores it. */
export function withSavedLayout(state: BoardsState, from: BoardsState): BoardsState {
  const layouts = { ...state.layouts, [gridKey(from.grid)]: snapshotLayout(from.boards) };
  return markValid({ grid: state.grid, boards: state.boards, layouts });
}
