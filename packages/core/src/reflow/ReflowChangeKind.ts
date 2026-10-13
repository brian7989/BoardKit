import type { ValueOf } from '../shared/unions/ValueOf.js';

export const ReflowChangeKind = {
  Moved: 'moved',
  Resized: 'resized',
  // No size fits this grid: the tile is parked (not deleted) and placed again on a grid it fits.
  Dropped: 'dropped',
  PageAdded: 'page-added',
} as const;

export type ReflowChangeKind = ValueOf<typeof ReflowChangeKind>;
