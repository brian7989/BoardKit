import { err, ok, type Result } from '../shared/index.js';
import { IssueKind, type Issue } from '../issues/index.js';
import { markValid, type ValidCandidate } from '../model/index.js';
import type { TileId } from '../shared/ids/TileId.js';
import type { EngineContext } from '../engine/index.js';
import { parseCandidate } from '../parse/index.js';
import { validateState } from '../validate/index.js';
import { relocateInvalidTile } from './relocateInvalidTile.js';
import { dropInvalidTile } from './dropInvalidTile.js';
import type { Repaired } from './Repaired.js';

const MAX_PASSES = 200;
const RELOCATABLE: ReadonlySet<IssueKind> = new Set([IssueKind.OutOfBounds, IssueKind.Overlap]);

// Explicit opt-in: keeps what is valid, relocates what it can, drops what it cannot,
// and reports exactly which tiles moved and which were dropped. Never runs implicitly.
export function repairState(input: unknown, ctx: EngineContext): Result<Repaired, readonly Issue[]> {
  const parsed = parseCandidate(input);
  if (!parsed.ok) return err(parsed.error);

  let candidate = parsed.value;
  const relocated: TileId[] = [];
  const dropped: TileId[] = [];

  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    const issues = validateState(candidate, ctx);
    if (issues.length === 0) return ok({ state: markValid(candidate), relocated, dropped });

    const target = pickRepairTarget(issues);
    if (!target) return err(issues);

    const step = repairOneTile(candidate, target, ctx);
    candidate = step.candidate;
    (step.relocated ? relocated : dropped).push(target.tile);
  }
  return err(validateState(candidate, ctx));
}

function pickRepairTarget(issues: readonly Issue[]): (Issue & { readonly tile: TileId }) | undefined {
  const target = issues.find((issue) => issue.tile !== undefined);
  return target?.tile ? { ...target, tile: target.tile } : undefined;
}

interface RepairStep {
  readonly candidate: ValidCandidate;
  readonly relocated: boolean;
}

function repairOneTile(candidate: ValidCandidate, target: Issue & { readonly tile: TileId }, ctx: EngineContext): RepairStep {
  const relocated = RELOCATABLE.has(target.kind) ? relocateInvalidTile(candidate, target.tile, ctx) : null;
  return relocated ? { candidate: relocated, relocated: true } : { candidate: dropInvalidTile(candidate, target.tile), relocated: false };
}
