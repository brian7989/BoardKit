import type { HandlerMap } from '../shared/unions/HandlerMap.js';
import { OpType } from './OpType.js';
import type { Op } from './Op.js';
import type { OpHandlerArgs, OpOutcome } from './OpHandler.js';
import { move } from './handlers/move.js';
import { resize } from './handlers/resize.js';
import { add } from './handlers/add.js';
import { remove } from './handlers/remove.js';
import { stack } from './handlers/stack.js';
import { unstack } from './handlers/unstack.js';
import { setActive } from './handlers/setActive.js';
import { reorderStack } from './handlers/reorderStack.js';
import { renameWidget } from './handlers/renameWidget.js';
import { addBoard } from './handlers/addBoard.js';
import { removeBoard } from './handlers/removeBoard.js';
import { setFloating } from './handlers/setFloating.js';
import { moveFloating } from './handlers/moveFloating.js';

export const opHandlers = {
  [OpType.Move]: move,
  [OpType.Resize]: resize,
  [OpType.Add]: add,
  [OpType.Remove]: remove,
  [OpType.Stack]: stack,
  [OpType.Unstack]: unstack,
  [OpType.SetActive]: setActive,
  [OpType.ReorderStack]: reorderStack,
  [OpType.RenameWidget]: renameWidget,
  [OpType.AddBoard]: addBoard,
  [OpType.RemoveBoard]: removeBoard,
  [OpType.SetFloating]: setFloating,
  [OpType.MoveFloating]: moveFloating,
} satisfies HandlerMap<Op, OpHandlerArgs, OpOutcome>;
