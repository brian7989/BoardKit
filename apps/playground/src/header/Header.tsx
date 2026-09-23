import { Group, Stack, Text } from '@mantine/core';
import { AddWidgetMenu } from './AddWidgetMenu';
import { BoardMenu } from './BoardMenu';

// The playground's chrome: widget and board management. Tiles are always draggable, so there's
// no edit toggle to render.
export function Header() {
  return (
    <Group justify="space-between" pb="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
      <Stack gap={0} style={{ minWidth: 0 }}>
        <Text component="h1" fw={800} size="lg" truncate>
          BoardKit playground
        </Text>
        <Text size="sm" c="dimmed" visibleFrom="sm">
          Drag tiles to rearrange.
        </Text>
      </Stack>
      <Group gap="xs" wrap="nowrap">
        <AddWidgetMenu />
        <BoardMenu />
      </Group>
    </Group>
  );
}
