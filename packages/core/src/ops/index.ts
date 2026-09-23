// Ops are the only way to change geometry. Each op is composed from the four
// primitives in primitives/; applyOp dispatches by OpType and re-validates before branding.
export { OpType } from './OpType.js';
export type { Op } from './Op.js';
export { applyOp } from './applyOp.js';
export { ChangeKind, RejectReason } from './outcome/index.js';
export type { Change, Rejection, Applied } from './outcome/index.js';
export type { MoveOp } from './handlers/move.js';
export type { ResizeOp } from './handlers/resize.js';
export type { AddOp } from './handlers/add.js';
export type { RemoveOp } from './handlers/remove.js';
export type { StackOp } from './handlers/stack.js';
export type { UnstackOp } from './handlers/unstack.js';
export type { SetActiveOp } from './handlers/setActive.js';
export type { ReorderStackOp } from './handlers/reorderStack.js';
export type { RenameWidgetOp } from './handlers/renameWidget.js';
export type { AddBoardOp } from './handlers/addBoard.js';
export type { RemoveBoardOp } from './handlers/removeBoard.js';
export type { SetFloatingOp } from './handlers/setFloating.js';
export type { MoveFloatingOp } from './handlers/moveFloating.js';
