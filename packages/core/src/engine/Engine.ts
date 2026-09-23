import type { Result } from '../shared/index.js';
import type { Point } from '../shared/geometry/Point.js';
import type { Cell } from '../shared/units/Cell.js';
import type { BoardId } from '../shared/ids/BoardId.js';
import type { Size } from '../shared/sizes/Size.js';
import type { BoardsState, SerializedState } from '../model/index.js';
import type { Issue } from '../issues/index.js';
import type { Op, Applied, Rejection } from '../ops/index.js';
import type { Repaired } from '../repair/index.js';
import type { ReflowResult } from '../reflow/index.js';

export interface Engine {
  parse(input: unknown): Result<BoardsState, readonly Issue[]>;
  serialize(state: BoardsState): SerializedState;
  apply(state: BoardsState, op: Op): Result<Applied, Rejection>;
  check(state: BoardsState): readonly Issue[];
  repair(input: unknown): Result<Repaired, readonly Issue[]>;
  empty(): BoardsState;
  findFree(state: BoardsState, board: BoardId, size: Size): Point<Cell> | null;
  // Switches `state` (built for any grid) onto this engine's own grid.
  reflow(state: BoardsState): ReflowResult;
}
