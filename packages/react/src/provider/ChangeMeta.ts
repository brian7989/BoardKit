import type { Change, Op, ReflowChange } from 'boardkit-core';
import { ChangeReason } from './ChangeReason.js';

/** Why a commit happened: a dispatched `Op` and its changes, or an automatic reflow's. */
export type ChangeMeta =
  | { readonly reason: typeof ChangeReason.Op; readonly op: Op; readonly changes: readonly Change[] }
  | { readonly reason: typeof ChangeReason.Reflow; readonly changes: readonly ReflowChange[] };
