import type { ValueOf } from 'boardkit-core';

/** Why a `BoardsState` changed: a dispatched `Op`, an automatic breakpoint reflow, or a reset to the authored layouts. */
export const ChangeReason = {
  Op: 'op',
  Reflow: 'reflow',
  Reset: 'reset',
} as const;

export type ChangeReason = ValueOf<typeof ChangeReason>;
