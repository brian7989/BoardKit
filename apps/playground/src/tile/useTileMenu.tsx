import { useState } from 'react';
import { modals } from '@mantine/modals';
import { Text } from '@mantine/core';
import { useTile, type Tile, type UseTileResult } from 'boardkit-react';

type TileMenuDialog = 'rename' | 'stack' | null;

export interface UseTileMenuResult {
  readonly t: UseTileResult;
  readonly dialog: TileMenuDialog;
  readonly setDialog: (dialog: TileMenuDialog) => void;
  readonly opened: boolean;
  readonly setOpened: (opened: boolean) => void;
  readonly isStack: boolean;
  readonly remove: () => void;
}

// Shared state/behavior behind the "..." menu, reused by both the floating (headerless) trigger
// and the inline one in the tileHeader strip.
export function useTileMenu(tile: Tile): UseTileMenuResult {
  const t = useTile(tile);
  const [dialog, setDialog] = useState<TileMenuDialog>(null);
  const [opened, setOpened] = useState(false);
  const isStack = t.stack.items.length >= 2;

  function remove() {
    if (!isStack) return void t.remove();
    modals.openConfirmModal({
      title: 'Remove all?',
      children: <Text size="sm">This removes all {t.stack.items.length} widgets stacked on this tile.</Text>,
      labels: { confirm: 'Remove all', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: t.remove,
    });
  }

  return { t, dialog, setDialog, opened, setOpened, isStack, remove };
}
