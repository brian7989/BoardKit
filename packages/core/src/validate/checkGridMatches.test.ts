import { describe, expect, it } from 'vitest';
import { checkGridMatches } from './checkGridMatches.js';
import { IssueKind } from '../issues/IssueKind.js';
import type { ValidCandidate } from '../model/BoardsState.js';
import type { EngineContext } from '../engine/EngineContext.js';

const CTX: EngineContext = { grid: { cols: 4, rows: 4, cellAspect: 1 }, catalog: {}, solver: { maxNodes: 1000, directions: [], nudgeOnResize: true } };

describe('checkGridMatches', () => {
  it('reports nothing when the state grid matches the engine', () => {
    const candidate: ValidCandidate = { grid: { cols: 4, rows: 4 }, boards: [] };
    expect(checkGridMatches(candidate, CTX)).toEqual([]);
  });

  it('reports GridMismatch when cols or rows differ', () => {
    const candidate: ValidCandidate = { grid: { cols: 4, rows: 5 }, boards: [] };
    const issues = checkGridMatches(candidate, CTX);
    expect(issues).toEqual([{ kind: IssueKind.GridMismatch, message: "State grid 4x5 does not match the engine's 4x4." }]);
  });
});
