import { err, ok, type Result } from '../shared/index.js';
import { IssueKind, type Issue } from '../issues/index.js';
import { STATE_VERSION, type Board, type ValidCandidate } from '../model/index.js';
import { readArray } from './readers/readArray.js';
import { readNumber } from './readers/readNumber.js';
import { readObject } from './readers/readObject.js';
import { parseBoard } from './parseBoard.js';
import { parseLayouts } from './parseLayouts.js';

// The oldest wire version this build still reads, migrating it in with no saved layouts.
const MIGRATABLE_STATE_VERSION = 1;

// Structural only, no semantic validation.
export function parseCandidate(input: unknown): Result<ValidCandidate, readonly Issue[]> {
  const object = readObject(input, '$');
  if (!object.ok) return err([object.error]);

  const version = readNumber(object.value['version'], '$.version');
  if (!version.ok) return err([version.error]);
  if (version.value !== STATE_VERSION && version.value !== MIGRATABLE_STATE_VERSION) {
    return err([{ kind: IssueKind.SchemaVersion, message: `Unsupported state version ${version.value}.` }]);
  }

  const grid = parseGrid(object.value['grid'], '$.grid');
  if (!grid.ok) return err(grid.error);
  const boards = parseBoards(object.value['boards'], '$.boards');
  if (!boards.ok) return err(boards.error);
  const layouts = parseLayouts(object.value['layouts'], '$.layouts');
  if (!layouts.ok) return err(layouts.error);

  return ok({ grid: grid.value, boards: boards.value, layouts: layouts.value });
}

function parseGrid(value: unknown, path: string): Result<{ cols: number; rows: number }, readonly Issue[]> {
  const object = readObject(value, path);
  if (!object.ok) return err([object.error]);
  const cols = readNumber(object.value['cols'], `${path}.cols`);
  if (!cols.ok) return err([cols.error]);
  const rows = readNumber(object.value['rows'], `${path}.rows`);
  if (!rows.ok) return err([rows.error]);
  return ok({ cols: cols.value, rows: rows.value });
}

function parseBoards(value: unknown, path: string): Result<readonly Board[], readonly Issue[]> {
  const array = readArray(value, path);
  if (!array.ok) return err([array.error]);
  const boards: Board[] = [];
  for (const [index, entry] of array.value.entries()) {
    const board = parseBoard(entry, `${path}[${index}]`);
    if (!board.ok) return err(board.error);
    boards.push(board.value);
  }
  return ok(boards);
}
