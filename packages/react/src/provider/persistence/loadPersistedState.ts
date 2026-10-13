import { createEngine, type BoardsState, type Engine } from 'boardkit-core';
import type { BoardsConfig } from '../config/BoardsConfig.js';
import { catalogOf } from '../../widget/index.js';
import { warnOnce } from '../../shared/dev/warnOnce.js';
import { readSavedGrid, type SavedGrid } from './readSavedGrid.js';
import { warnUnregisteredLoadedWidgets } from './warnUnregisteredLoadedWidgets.js';

function readRaw(storageKey: string): unknown {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved === null ? null : JSON.parse(saved);
  } catch {
    return null;
  }
}

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

/** Loads and repairs a saved board from `localStorage`, or null if there is nothing usable. */
export function loadPersistedState(config: BoardsConfig, storageKey: string): BoardsState | null {
  if (typeof window === 'undefined') return null;
  const raw = readRaw(storageKey);
  if (raw === null) return null;
  warnUnregisteredLoadedWidgets(raw, config.widgets);
  const { engine, current } = engineForSave(config, readSavedGrid(raw));
  const repaired = engine.repair(raw);
  if (!repaired.ok) {
    warnOnce(`discarded-save:${storageKey}`, `Boards: discarded the save under "${storageKey}": ${repaired.error[0]?.message}`);
    return null;
  }
  return current ? repaired.value.state : config.engine.reflow(repaired.value.state).state;
}
