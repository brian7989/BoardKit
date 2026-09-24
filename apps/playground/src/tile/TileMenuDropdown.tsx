import type { ReactNode } from 'react';
import { Menu } from '@mantine/core';
import { IconArrowsMove, IconLayersIntersect, IconLayoutGrid, IconMaximize, IconMinimize, IconPencil, IconTrash } from '@tabler/icons-react';
import { RenameModal } from './RenameModal';
import { SizePicker } from './SizePicker';
import { StackModal } from './StackModal';
import type { UseTileMenuResult } from './useTileMenu';

export interface TileMenuDropdownProps extends UseTileMenuResult {
  readonly trigger: ReactNode;
}

// The menu content itself, shared by the floating (headerless) trigger and the inline one in
// the tileHeader strip — only the trigger element differs between the two.
export function TileMenuDropdown({ t, dialog, setDialog, opened, setOpened, isStack, remove, trigger }: TileMenuDropdownProps) {
  return (
    <>
      <Menu opened={opened} onChange={setOpened} position="bottom-end" withinPortal>
        <Menu.Target>{trigger}</Menu.Target>
        <Menu.Dropdown miw={200}>
          {t.size.options.length > 1 ? <SizePicker size={t.size} onPicked={() => setOpened(false)} /> : null}
          <Menu.Item leftSection={t.float.isFloating ? <IconMinimize size={14} /> : <IconMaximize size={14} />} onClick={() => t.float.toggle()}>
            {t.float.isFloating ? 'Unfloat' : 'Float'}
          </Menu.Item>
          {t.float.isFloating ? (
            <Menu.Item
              leftSection={t.float.isFree ? <IconLayoutGrid size={14} /> : <IconArrowsMove size={14} />}
              onClick={() => t.float.setFree(!t.float.isFree)}
            >
              {t.float.isFree ? 'Snap to grid' : 'Move freely'}
            </Menu.Item>
          ) : null}
          <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => setDialog('rename')}>
            Rename…
          </Menu.Item>
          {t.stack.canCombine || t.stack.isStack ? (
            <Menu.Item leftSection={<IconLayersIntersect size={14} />} onClick={() => setDialog('stack')}>
              Stack…
            </Menu.Item>
          ) : null}
          <Menu.Divider />
          <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={remove}>
            {isStack ? 'Remove all' : 'Remove'}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <RenameModal name={t.name} opened={dialog === 'rename'} onClose={() => setDialog(null)} />
      <StackModal stack={t.stack} opened={dialog === 'stack'} onClose={() => setDialog(null)} />
    </>
  );
}
