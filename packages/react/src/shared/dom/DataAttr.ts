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
  TileFrame: 'data-bk-tile-frame',
  TileHeader: 'data-bk-tile-header',
  TileHeaderPlacement: 'data-bk-tile-header-placement',
  TileBody: 'data-bk-tile-body',
  Empty: 'data-bk-empty',
  DragFrom: 'data-bk-drag-from',
} as const;

export type DataAttr = ValueOf<typeof DataAttr>;
