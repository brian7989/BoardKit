import { describe, expect, it } from 'vitest';
import { repairState } from './repairState.js';
import { IssueKind } from '../issues/IssueKind.js';
import { tileId } from '../shared/ids/TileId.js';
import { STATE_VERSION } from '../model/StateVersion.js';
import { SolverDefaults } from '../solver/index.js';
import { cell } from '../shared/units/Cell.js';
import type { EngineContext } from '../engine/EngineContext.js';

const GRID = { cols: 4, rows: 4 };
const WIDGET_TYPE = 'demo.widget';
const CTX: EngineContext = { grid: { ...GRID, cellAspect: 1 }, catalog: { [WIDGET_TYPE]: { sizes: [{ w: cell(1), h: cell(1) }] } }, solver: SolverDefaults };

function rawTile(id: string, col: number, row: number) {
  return { id, col, row, size: { w: 1, h: 1 }, active: 0, items: [{ id: `${id}-w`, type: WIDGET_TYPE }] };
}

function rawState(tiles: readonly ReturnType<typeof rawTile>[]): unknown {
  return { version: STATE_VERSION, grid: GRID, boards: [{ id: 'default', tiles }] };
}

describe('repairState', () => {
  it('rejects structurally malformed input without attempting to repair it', () => {
    const result = repairState({ version: STATE_VERSION, grid: GRID, boards: 'nope' }, CTX);
    expect(result).toEqual({ ok: false, error: [{ kind: IssueKind.Malformed, path: '$.boards', message: 'Expected an array at $.boards.' }] });
  });

  it('is a no-op for an already-valid state', () => {
    const result = repairState(rawState([rawTile('t0', 0, 0)]), CTX);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.relocated).toEqual([]);
    expect(result.value.dropped).toEqual([]);
  });

  it('relocates an out-of-bounds tile to free space', () => {
    const result = repairState(rawState([rawTile('t0', 0, 0), rawTile('bad', 10, 10)]), CTX);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.relocated).toEqual([tileId('bad')]);
    expect(result.value.dropped).toEqual([]);
    const relocated = result.value.state.boards[0]?.tiles.find((tile) => tile.id === tileId('bad'));
    expect(relocated).toMatchObject({ col: 1, row: 0 });
  });

  it('relocates one of two overlapping tiles (the earlier one, which checkOverlap names)', () => {
    const result = repairState(rawState([rawTile('t0', 0, 0), rawTile('t1', 0, 0)]), CTX);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.relocated).toEqual([tileId('t0')]);
    const tiles = result.value.state.boards[0]?.tiles ?? [];
    expect(tiles.find((tile) => tile.id === tileId('t1'))).toMatchObject({ col: 0, row: 0 });
    expect(tiles.find((tile) => tile.id === tileId('t0'))).toMatchObject({ col: 1, row: 0 });
  });

  it('drops an invalid tile when there is no free space to relocate it to', () => {
    const tiles = Array.from({ length: GRID.cols * GRID.rows }, (_, index) => rawTile(`t${index}`, index % GRID.cols, Math.floor(index / GRID.cols)));
    const result = repairState(rawState([...tiles, rawTile('overflow', 99, 99)]), CTX);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.dropped).toEqual([tileId('overflow')]);
    expect(result.value.relocated).toEqual([]);
    expect(result.value.state.boards[0]?.tiles.some((tile) => tile.id === tileId('overflow'))).toBe(false);
  });

  it('repairing an already-repaired state is idempotent', () => {
    const once = repairState(rawState([rawTile('t0', 0, 0), rawTile('bad', 10, 10)]), CTX);
    if (!once.ok) throw new Error('expected first repair to succeed');
    const twice = repairState(JSON.parse(JSON.stringify(once.value.state)), CTX);
    expect(twice).toEqual({ ok: true, value: { state: once.value.state, relocated: [], dropped: [] } });
  });

  it('rejects with the raw issues when a semantic problem has no single tile to target', () => {
    // GridMismatch is a state-level issue: it names no tile, so repair cannot pick a target
    // and must report the underlying issues instead of looping forever.
    const result = repairState({ version: STATE_VERSION, grid: { cols: 5, rows: 5 }, boards: [{ id: 'default', tiles: [] }] }, CTX);
    expect(result).toEqual({ ok: false, error: [{ kind: IssueKind.GridMismatch, message: "State grid 5x5 does not match the engine's 4x4." }] });
  });
});
