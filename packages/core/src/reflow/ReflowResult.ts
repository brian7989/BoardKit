import type { BoardsState } from '../model/index.js';
import type { ReflowChange } from './ReflowChange.js';

export interface ReflowResult {
  readonly state: BoardsState;
  readonly changes: readonly ReflowChange[];
}
