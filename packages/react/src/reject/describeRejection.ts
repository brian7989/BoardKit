import { RejectReason, type Rejection } from 'boardkit-core';

const MESSAGE: Record<RejectReason, string> = {
  [RejectReason.OutOfBounds]: 'That would go off the edge of the board.',
  [RejectReason.NoValidArrangement]: "Couldn't fit — try moving a few tiles first.",
  [RejectReason.NoFreeSpace]: 'No room for this on the current board.',
  [RejectReason.SizeNotAllowed]: "This widget doesn't support that size.",
  [RejectReason.StackIncompatible]: 'Only tiles of the same size can stack.',
  [RejectReason.LastBoard]: "Can't remove the only board.",
  [RejectReason.UnknownTarget]: 'That tile or board no longer exists.',
  [RejectReason.NotFloating]: "That widget isn't floating.",
};

/** One friendly, ready-to-show English line for a `Rejection`, exhaustive over `RejectReason`. */
export function describeRejection(rejection: Rejection): string {
  return MESSAGE[rejection.reason];
}
