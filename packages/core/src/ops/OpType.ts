import type { ValueOf } from '../shared/unions/ValueOf.js';

/** Every kind of change an `Op` can make to a board. */
export const OpType = {
  Move: 'move',
  Resize: 'resize',
  Add: 'add',
  Remove: 'remove',
  Stack: 'stack',
  Unstack: 'unstack',
  SetActive: 'set-active',
  ReorderStack: 'reorder-stack',
  RenameWidget: 'rename-widget',
  AddBoard: 'add-board',
  RemoveBoard: 'remove-board',
  SetFloating: 'set-floating',
  MoveFloating: 'move-floating',
} as const;

export type OpType = ValueOf<typeof OpType>;
