import type { ValueOf } from '../../shared/unions/ValueOf.js';

/** Why the engine turned down an `Op`; see `describeRejection` for a friendly message per reason. */
export const RejectReason = {
  OutOfBounds: 'out-of-bounds',
  NoValidArrangement: 'no-valid-arrangement',
  NoFreeSpace: 'no-free-space',
  SizeNotAllowed: 'size-not-allowed',
  StackIncompatible: 'stack-incompatible',
  LastBoard: 'last-board',
  UnknownTarget: 'unknown-target',
  NotFloating: 'not-floating',
} as const;

export type RejectReason = ValueOf<typeof RejectReason>;
