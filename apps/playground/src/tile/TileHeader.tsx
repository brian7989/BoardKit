import { ActionIcon, Group, Text } from '@mantine/core';
import { IconDots } from '@tabler/icons-react';
import { noDragProps, TileHeaderPlacement, type TileHeaderProps } from 'boardkit-react';
import { TileMenuDropdown } from './TileMenuDropdown';
import { useTileMenu, type UseTileMenuResult } from './useTileMenu';

const NAME_STYLE = { opacity: 0.75, color: 'inherit' } as const;
// The library's overlay wrapper is pointer-events: none, so only this trigger opts back in.
const OVERLAY_TRIGGER_STYLE = { pointerEvents: 'auto' } as const;

interface HeaderContentProps {
  readonly name: string;
  readonly menu: UseTileMenuResult;
}

// The library's header strip, filled by the host: the widget's name on the left, the "..." trigger on the right.
function StripHeader({ name, menu }: HeaderContentProps) {
  const trigger = (
    <ActionIcon aria-label={`Options for ${name}`} className="tile-menu-trigger" variant="subtle" c="inherit" size={24} {...noDragProps()}>
      <IconDots size={16} />
    </ActionIcon>
  );

  return (
    <Group h="100%" px={8} justify="space-between" wrap="nowrap" gap={4}>
      <Text size="sm" fw={600} truncate style={NAME_STYLE}>
        {name}
      </Text>
      <TileMenuDropdown {...menu} trigger={trigger} />
    </Group>
  );
}

// A header:false widget keeps its full body; only the "..." trigger floats over its top-right
// corner, transparent so the rest of the overlay strip lets clicks through to the widget.
function OverlayHeader({ name, menu }: HeaderContentProps) {
  const trigger = (
    <ActionIcon aria-label={`Options for ${name}`} className="tile-menu-trigger" variant="subtle" c="dimmed" bg="transparent" size={28} style={OVERLAY_TRIGGER_STYLE} {...noDragProps()}>
      <IconDots size={18} />
    </ActionIcon>
  );

  return (
    <Group h="100%" px={8} justify="flex-end" wrap="nowrap">
      <TileMenuDropdown {...menu} trigger={trigger} />
    </Group>
  );
}

// The board's tileHeader: a strip with the name and menu for normal widgets, or just a floating
// menu trigger for header:false ones (which the library now overlays instead of omitting).
export function TileHeader({ tile, name, placement }: TileHeaderProps) {
  const menu = useTileMenu(tile);
  return placement === TileHeaderPlacement.Strip ? <StripHeader name={name} menu={menu} /> : <OverlayHeader name={name} menu={menu} />;
}
