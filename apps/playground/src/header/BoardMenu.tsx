import { ActionIcon, Button, Group, Menu, Text } from '@mantine/core';
import { IconLayoutGrid, IconPlus, IconTrash } from '@tabler/icons-react';
import { useBoardList } from 'boardkit-react';

// Boards have no name of their own (just an id and its tiles), so rows are numbered by
// position — the same thing the page dots' order already implies.
export function BoardMenu() {
  const { boards, activeId, select, add, remove, canRemove } = useBoardList();

  return (
    <Menu position="bottom-end" withinPortal closeOnItemClick={false}>
      <Menu.Target>
        <Button size="sm" variant="default" leftSection={<IconLayoutGrid size={16} />}>
          Boards
        </Button>
      </Menu.Target>
      <Menu.Dropdown miw={220}>
        {boards.map((board) => (
          <Menu.Item
            key={board.id}
            onClick={() => select(board.id)}
            {...(board.id === activeId ? { bg: 'var(--mantine-color-blue-light)' } : {})}
            rightSection={
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                disabled={!canRemove(board.id)}
                aria-label={`Remove board ${board.index + 1}`}
                onClick={(event) => {
                  event.stopPropagation();
                  remove(board.id);
                }}
              >
                <IconTrash size={14} />
              </ActionIcon>
            }
          >
            <Group gap={6}>
              <Text size="sm">Board {board.index + 1}</Text>
              <Text size="xs" c="dimmed">
                {board.tileCount} widgets
              </Text>
            </Group>
          </Menu.Item>
        ))}
        <Menu.Divider />
        <Menu.Item leftSection={<IconPlus size={14} />} onClick={() => add()}>
          Add board
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
