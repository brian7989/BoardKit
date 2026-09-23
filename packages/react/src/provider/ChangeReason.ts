import type { ValueOf } from 'boardkit-core';

/** Why a `BoardsState` changed: a dispatched `Op`, or an automatic breakpoint reflow. */
export const ChangeReason = {
  Op: 'op',
  Reflow: 'reflow',
} as const;

export type ChangeReason = ValueOf<typeof ChangeReason>;
