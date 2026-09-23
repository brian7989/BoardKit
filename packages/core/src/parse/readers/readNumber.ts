import { IssueKind, type Issue } from '../../issues/index.js';
import { err, ok, type Result } from '../../shared/index.js';

export function readNumber(value: unknown, path: string): Result<number, Issue> {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return err({ kind: IssueKind.Malformed, path, message: `Expected a number at ${path}.` });
  }
  return ok(value);
}
