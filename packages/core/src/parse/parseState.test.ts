import { describe, expect, it } from 'vitest';
import { parseState } from './parseState.js';
import { IssueKind } from '../issues/IssueKind.js';
import { STATE_VERSION } from '../model/StateVersion.js';
import { SolverDefaults } from '../solver/index.js';
import { cell } from '../shared/units/Cell.js';
import type { EngineContext } from '../engine/index.js';

const WIDGET_TYPE = 'demo.widget';
const CTX: EngineContext = {
  grid: { cols: 4, rows: 4, cellAspect: 1 },
  catalog: { [WIDGET_TYPE]: { sizes: [{ w: cell(1), h: cell(1) }] } },
  solver: SolverDefaults,
};

function rawState(tiles: readonly { readonly id: string; readonly col: number; readonly row: number }[] = []): unknown {
  return {
    version: STATE_VERSION,
    grid: { cols: 4, rows: 4 },
    boards: [
      {
        id: 'default',
        tiles: tiles.map((tile) => ({
          id: tile.id,
          col: tile.col,
          row: tile.row,
          size: { w: 1, h: 1 },
          active: 0,
          items: [{ id: `${tile.id}-w`, type: WIDGET_TYPE }],
        })),
      },
    ],
  };
}

describe('parseState', () => {
  it('rejects structurally malformed input before running any semantic check', () => {
    const result = parseState({ version: STATE_VERSION, grid: { cols: 4, rows: 4 }, boards: 'nope' }, CTX);
    expect(result).toEqual({ ok: false, error: [{ kind: IssueKind.Malformed, path: '$.boards', message: 'Expected an array at $.boards.' }] });
  });

  it('rejects a structurally valid candidate that fails semantic validation', () => {
    // Out of bounds: col 10 on a 4-wide grid.
    const result = parseState(rawState([{ id: 't0', col: 10, row: 0 }]), CTX);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.some((issue) => issue.kind === IssueKind.OutOfBounds)).toBe(true);
  });

  it('migrates a legacy version 1 state in with an empty layouts map', () => {
    const result = parseState({ ...rawState([{ id: 't0', col: 0, row: 0 }]), version: 1 }, CTX);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.layouts).toEqual({});
  });

  it('round-trips a valid state through serialize and back to an equal value', () => {
    const parsed = parseState(rawState([{ id: 't0', col: 1, row: 1 }]), CTX);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    // serialize is the identity function at runtime; JSON round-tripping is what actually
    // exercises the wire format a host would persist and reload.
    const roundTripped = parseState(JSON.parse(JSON.stringify(parsed.value)), CTX);
    expect(roundTripped).toEqual(parsed);
  });
});
