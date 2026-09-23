import { useEffect, useState } from 'react';
import { Button, Group, Modal, TextInput } from '@mantine/core';
import type { UseTileNameResult } from 'boardkit-react';

export interface RenameModalProps {
  readonly name: UseTileNameResult;
  readonly opened: boolean;
  readonly onClose: () => void;
}

// Explicit Save rather than commit-on-blur: the modal's own backdrop click closes it, and
// silently keeping whatever's typed in that case would be the wrong default.
export function RenameModal({ name, opened, onClose }: RenameModalProps) {
  const [value, setValue] = useState(name.current);
  useEffect(() => {
    if (opened) setValue(name.current);
  }, [opened, name.current]);

  function save() {
    name.set(value);
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Rename" size="xs">
      <TextInput
        data-autofocus
        aria-label="Widget name"
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
        onKeyDown={(event) => event.key === 'Enter' && save()}
      />
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save}>Save</Button>
      </Group>
    </Modal>
  );
}
