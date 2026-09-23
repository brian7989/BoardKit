import type { ValueOf } from '../shared/unions/ValueOf.js';

export const ReflowChangeKind = {
  Moved: 'moved',
  Resized: 'resized',
  Dropped: 'dropped',
  PageAdded: 'page-added',
} as const;

export type ReflowChangeKind = ValueOf<typeof ReflowChangeKind>;
