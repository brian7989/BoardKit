import type { ValueOf } from '../../shared/unions/ValueOf.js';

export const ChangeKind = {
  Moved: 'moved',
  Resized: 'resized',
  Added: 'added',
  Removed: 'removed',
  Stacked: 'stacked',
  Unstacked: 'unstacked',
  Activated: 'activated',
  Reordered: 'reordered',
  Renamed: 'renamed',
  BoardAdded: 'board-added',
  BoardRemoved: 'board-removed',
  Floated: 'floated',
  Unfloated: 'unfloated',
} as const;

export type ChangeKind = ValueOf<typeof ChangeKind>;
