import { IssueKind, type Issue } from '../../issues/index.js';
import { err, ok, type Result } from '../../shared/index.js';

export function readArray(value: unknown, path: string): Result<readonly unknown[], Issue> {
  if (!Array.isArray(value)) {
    return err({ kind: IssueKind.Malformed, path, message: `Expected an array at ${path}.` });
  }
  return ok(value);
}
