import { IssueKind, type Issue } from '../../issues/index.js';
import { err, ok, type Result } from '../../shared/index.js';

// No board model knowledge here; only structural validation.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readObject(value: unknown, path: string): Result<Record<string, unknown>, Issue> {
  if (!isRecord(value)) {
    return err({ kind: IssueKind.Malformed, path, message: `Expected an object at ${path}.` });
  }
  return ok(value);
}
