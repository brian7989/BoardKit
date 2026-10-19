import { createEngine, type BoardsState, type Engine } from 'boardkit-core';
import type { BoardsConfig } from '../config/BoardsConfig.js';
import { catalogOf } from '../../widget/index.js';
import { warnOnce } from '../../shared/dev/warnOnce.js';
import { readSavedGrid, type SavedGrid } from './readSavedGrid.js';
import { warnUnregisteredLoadedWidgets } from './warnUnregisteredLoadedWidgets.js';

interface SaveEngine {
  readonly engine: Engine;
  // False when no breakpoint uses the saved grid any more, so the repaired state still needs a reflow.
  readonly current: boolean;
}

// Checked against the grid it was made on (the widest would reject every narrower save): that
// breakpoint's engine, or a one-off engine for a grid the config no longer has.
function engineForSave(config: BoardsConfig, grid: SavedGrid | null): SaveEngine {
  if (!grid) return { engine: config.engine, current: true };
  const match = config.breakpoints.find((breakpoint) => breakpoint.grid.cols === grid.cols && breakpoint.grid.rows === grid.rows);
  if (match) return { engine: match.engine, current: true };
  return { engine: createEngine({ grid, catalog: catalogOf([...config.widgets.values()]) }), current: false };
}

/** A saved board, migrated and repaired onto the right grid, or null if nothing was saved or it's unusable. `source` names it in the dev warning. */
export function restoreSave(config: BoardsConfig, saved: unknown, source: string): BoardsState | null {
  if (saved === null || saved === undefined) return null;
  warnUnregisteredLoadedWidgets(saved, config.widgets);
  const { engine, current } = engineForSave(config, readSavedGrid(saved));
  const repaired = engine.repair(saved);
  if (!repaired.ok) {
    warnOnce(`discarded-save:${source}`, `Boards: discarded ${source}: ${repaired.error[0]?.message}`);
    return null;
  }
  return current ? repaired.value.state : config.engine.reflow(repaired.value.state).state;
}
