import type { ValueOf } from '../../shared/unions/ValueOf.js';

// StackAvailable and Stacked arrive with the Stack op.
export const AnnouncementKey = {
  PickedUp: 'picked-up',
  Moved: 'moved',
  Dropped: 'dropped',
  Cancelled: 'cancelled',
  Rejected: 'rejected',
} as const;

export type AnnouncementKey = ValueOf<typeof AnnouncementKey>;
