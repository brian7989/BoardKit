import type { BoardsState } from '../../model/index.js';
import type { Change } from './Change.js';

export interface Applied {
  readonly state: BoardsState;
  readonly changes: readonly Change[];
}
