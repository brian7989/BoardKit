import { describe, expect, it } from 'vitest';
import { parseCandidate } from './parseCandidate.js';
import { IssueKind } from '../issues/IssueKind.js';
import { STATE_VERSION } from '../model/StateVersion.js';

const VALID = { version: STATE_VERSION, grid: { cols: 4, rows: 4 }, boards: [{ id: 'default', tiles: [] }] };

describe('parseCandidate', () => {
  it('parses a valid candidate', () => {
    const result = parseCandidate(VALID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.grid).toEqual({ cols: 4, rows: 4 });
    expect(result.value.boards).toHaveLength(1);
  });

  it('rejects a non-object input', () => {
    expect(parseCandidate('nope')).toEqual({ ok: false, error: [{ kind: IssueKind.Malformed, path: '$', message: 'Expected an object at $.' }] });
  });

  it('rejects a missing or non-numeric version', () => {
    const { version, ...rest } = VALID;
    expect(parseCandidate(rest).ok).toBe(false);
  });

  it('rejects an unsupported version with SchemaVersion, not Malformed', () => {
    const result = parseCandidate({ ...VALID, version: STATE_VERSION + 1 });
    expect(result).toEqual({ ok: false, error: [{ kind: IssueKind.SchemaVersion, message: `Unsupported state version ${STATE_VERSION + 1}.` }] });
  });

  it('migrates a legacy version 1 state (no layouts) in with an empty layouts map', () => {
    const result = parseCandidate({ ...VALID, version: 1 });
    expect(result).toEqual({ ok: true, value: { grid: VALID.grid, boards: VALID.boards, layouts: {} } });
  });

  it('parses a saved layouts map alongside boards', () => {
    const layouts = { '4x4': [{ tile: 't0', board: 'default', col: 0, row: 0, size: { w: 1, h: 1 } }] };
    const result = parseCandidate({ ...VALID, layouts });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.layouts?.['4x4']).toHaveLength(1);
  });

  it('rejects a malformed layouts field', () => {
    const result = parseCandidate({ ...VALID, layouts: 'nope' });
    expect(result).toEqual({ ok: false, error: [{ kind: IssueKind.Malformed, path: '$.layouts', message: 'Expected an object at $.layouts.' }] });
  });

  it('rejects a malformed grid', () => {
    const result = parseCandidate({ ...VALID, grid: 'nope' });
    expect(result).toEqual({ ok: false, error: [{ kind: IssueKind.Malformed, path: '$.grid', message: 'Expected an object at $.grid.' }] });
  });

  it('rejects a grid missing cols or rows', () => {
    expect(parseCandidate({ ...VALID, grid: { rows: 4 } }).ok).toBe(false);
    expect(parseCandidate({ ...VALID, grid: { cols: 4 } }).ok).toBe(false);
  });

  it('rejects a non-array boards', () => {
    const result = parseCandidate({ ...VALID, boards: 'nope' });
    expect(result).toEqual({ ok: false, error: [{ kind: IssueKind.Malformed, path: '$.boards', message: 'Expected an array at $.boards.' }] });
  });

  it('propagates a malformed board inside boards, with its indexed path', () => {
    const result = parseCandidate({ ...VALID, boards: [{ tiles: [] }] });
    expect(result).toEqual({ ok: false, error: [{ kind: IssueKind.Malformed, path: '$.boards[0].id', message: 'Expected a string at $.boards[0].id.' }] });
  });
});
