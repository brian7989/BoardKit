import type { ValueOf } from 'boardkit-core';

export const AriaRole = {
  Group: 'group',
  Status: 'status',
  Menu: 'menu',
  MenuItem: 'menuitem',
  Dialog: 'dialog',
} as const;

export type AriaRole = ValueOf<typeof AriaRole>;
