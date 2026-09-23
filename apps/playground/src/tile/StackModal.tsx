import { ActionIcon, Button, Group, Modal, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconMinus } from '@tabler/icons-react';
import type { WidgetId, UseTileStackResult } from 'boardkit-react';

export interface StackModalProps {
  readonly stack: UseTileStackResult;
  readonly opened: boolean;
  readonly onClose: () => void;
}

// Picking a tile to combine with is a board-level mode, so this closes first for the user to select.
export function StackModal({ stack, opened, onClose }: StackModalProps) {
  function select(widget: WidgetId) {
    stack.select(widget);
    onClose();
  }
  function startPicking() {
    onClose();
    stack.startPicking();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Stack" size="xs">
      <Stack gap={4}>
        {stack.items.length >= 2 ? (
          stack.items.map((item) => (
            <Group key={item.id} gap={4} wrap="nowrap">
              <UnstyledButton flex={1} px="xs" py={6} fw={item.isActive ? 600 : 400} {...(item.isActive ? { c: 'blue' } : {})} onClick={() => select(item.id)}>
                {item.name}
              </UnstyledButton>
              <ActionIcon variant="subtle" color="gray" aria-label={`Remove ${item.name} from stack`} onClick={() => stack.unstack(item.id)}>
                <IconMinus size={16} />
              </ActionIcon>
            </Group>
          ))
        ) : (
          <Text size="sm" c="dimmed">
            Not stacked with anything yet.
          </Text>
        )}
      </Stack>
      {stack.canCombine ? (
        <Group justify="flex-end" mt="md">
          <Button onClick={startPicking}>Stack with…</Button>
        </Group>
      ) : null}
    </Modal>
  );
}
