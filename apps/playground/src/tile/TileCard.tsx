import { ActionIcon, Group, Text } from '@mantine/core';
import { IconDots } from '@tabler/icons-react';
import { noDragProps, type TileProps } from 'boardkit-react';
import { TileMenuDropdown } from './TileMenuDropdown';
import { useTileMenu, type UseTileMenuResult } from './useTileMenu';

const NAME_STYLE = { opacity: 0.75, color: 'inherit' } as const;

interface MenuTriggerProps {
  readonly name: string;
  readonly menu: UseTileMenuResult;
}

// The drag handle: the widget's name on the left, the "..." trigger on the right.
function HeaderStrip({ name, menu, dragHandle }: MenuTriggerProps & Pick<TileProps, 'dragHandle'>) {
  const trigger = (
    <ActionIcon aria-label={`Options for ${name}`} className="tile-menu-trigger" variant="subtle" c="inherit" size={24} {...noDragProps()}>
      <IconDots size={16} />
    </ActionIcon>
  );

  return (
    <Group className="tile-card-header" px={8} justify="space-between" wrap="nowrap" gap={4} {...dragHandle}>
      <Text size="sm" fw={600} truncate style={NAME_STYLE}>
        {name}
      </Text>
      <TileMenuDropdown {...menu} trigger={trigger} />
    </Group>
  );
}

// A header:false widget keeps its full body, with only the "..." trigger over its top-right corner.
function CornerMenu({ name, menu }: MenuTriggerProps) {
  const trigger = (
    <ActionIcon aria-label={`Options for ${name}`} className="tile-menu-trigger" variant="subtle" c="dimmed" bg="transparent" size={28} {...noDragProps()}>
      <IconDots size={18} />
    </ActionIcon>
  );

  return (
    <div className="tile-card-corner">
      <TileMenuDropdown {...menu} trigger={trigger} />
    </div>
  );
}

// The board's tile: a card with a header strip to drag by, or a corner menu for header:false widgets
// (which then drag from anywhere).
export function TileCard({ tile, widget, dragHandle, surface, header }: TileProps) {
  const menu = useTileMenu(tile);
  const name = menu.t.name.current;
  return (
    <div className="tile-card" style={surface}>
      {header ? <HeaderStrip name={name} menu={menu} dragHandle={dragHandle} /> : <CornerMenu name={name} menu={menu} />}
      <div className="tile-card-body">{widget}</div>
    </div>
  );
}
