import { err, ok, type Result } from '../shared/index.js';
import type { Issue } from '../issues/index.js';
import { markValid, type BoardsState } from '../model/index.js';
import { validateState } from '../validate/index.js';
import type { EngineContext } from '../engine/index.js';
import { parseCandidate } from './parseCandidate.js';

// Structure, then validation, then brand.
export function parseState(input: unknown, ctx: EngineContext): Result<BoardsState, readonly Issue[]> {
  const candidate = parseCandidate(input);
  if (!candidate.ok) return err(candidate.error);

  const issues = validateState(candidate.value, ctx);
  return issues.length > 0 ? err(issues) : ok(markValid(candidate.value));
}
