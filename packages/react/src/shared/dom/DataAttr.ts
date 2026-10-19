import type { ValueOf } from 'boardkit-core';

export const DataAttr = {
  TileId: 'data-bk-tile-id',
  Draggable: 'data-bk-draggable',
  Lifted: 'data-bk-lifted',
  Active: 'data-bk-active',
  Valid: 'data-bk-valid',
  Placeholder: 'data-bk-placeholder',
  NoDrag: 'data-bk-no-drag',
  StackRole: 'data-bk-stack-role',
  Floating: 'data-bk-floating',
  Free: 'data-bk-free',
  TileBody: 'data-bk-tile-body',
  Empty: 'data-bk-empty',
  DragHandle: 'data-bk-drag-handle',
} as const;

export type DataAttr = ValueOf<typeof DataAttr>;
