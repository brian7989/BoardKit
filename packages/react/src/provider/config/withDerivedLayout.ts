import { hideTiles, withSavedLayout, type BoardsState } from 'boardkit-core';
import type { ResolvedBreakpoint } from './ResolvedBreakpoint.js';
import { allTiles } from './allTiles.js';
import { hiddenTileIds } from './hiddenTileIds.js';

export interface DerivedLayoutInput {
  readonly base: BoardsState;
  readonly source: ResolvedBreakpoint;
  readonly target: ResolvedBreakpoint;
}

// Same for every visit: always reflowed from `source`'s layout, never from wherever the board happens to come from.
export function withDerivedLayout({ base, source, target }: DerivedLayoutInput): BoardsState {
  const onSource = source.engine.reflow(base).state;
  const placed = target.engine.reflow(onSource).state;
  const hide = [...source.hide, ...target.hide];
  return withSavedLayout(base, hideTiles(placed, hiddenTileIds(allTiles(placed), hide, target.name)));
}
