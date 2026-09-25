import type { MoveOp } from './handlers/move.js';
import type { ResizeOp } from './handlers/resize.js';
import type { AddOp } from './handlers/add.js';
import type { RemoveOp } from './handlers/remove.js';
import type { StackOp } from './handlers/stack.js';
import type { UnstackOp } from './handlers/unstack.js';
import type { SetActiveOp } from './handlers/setActive.js';
import type { ReorderStackOp } from './handlers/reorderStack.js';
import type { RenameWidgetOp } from './handlers/renameWidget.js';
import type { AddBoardOp } from './handlers/addBoard.js';
import type { RemoveBoardOp } from './handlers/removeBoard.js';
import type { SetFloatingOp } from './handlers/setFloating.js';
import type { MoveFloatingOp } from './handlers/moveFloating.js';
import type { SetFloatFreeOp } from './handlers/setFloatFree.js';
import type { SetWidgetPropsOp } from './handlers/setWidgetProps.js';

/** Every kind of change that can be dispatched against a `BoardsState`. */
export type Op =
  | MoveOp
  | ResizeOp
  | AddOp
  | RemoveOp
  | StackOp
  | UnstackOp
  | SetActiveOp
  | ReorderStackOp
  | RenameWidgetOp
  | AddBoardOp
  | RemoveBoardOp
  | SetFloatingOp
  | MoveFloatingOp
  | SetFloatFreeOp
  | SetWidgetPropsOp;
