import { IssueKind, type Issue } from '../../issues/index.js';
import { err, ok, type Result } from '../../shared/index.js';

export function readString(value: unknown, path: string): Result<string, Issue> {
  if (typeof value !== 'string') {
    return err({ kind: IssueKind.Malformed, path, message: `Expected a string at ${path}.` });
  }
  return ok(value);
}
