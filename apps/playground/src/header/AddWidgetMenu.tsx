import { Button, Menu, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useWidgetCatalog } from 'boardkit-react';

export function AddWidgetMenu() {
  const { widgets, add } = useWidgetCatalog();

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <Button size="sm" leftSection={<IconPlus size={16} />}>
          Add widget
        </Button>
      </Menu.Target>
      <Menu.Dropdown miw={220} mah={360} style={{ overflowY: 'auto' }}>
        {widgets.map((manifest) => (
          <Menu.Item key={manifest.type} onClick={() => add(manifest.type)}>
            {manifest.title}
            <Text span size="xs" c="dimmed" ml={6}>
              {manifest.sizes.length} size{manifest.sizes.length > 1 ? 's' : ''}
            </Text>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
