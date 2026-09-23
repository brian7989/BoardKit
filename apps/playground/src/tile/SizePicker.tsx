import { Menu, SegmentedControl } from '@mantine/core';
import type { Size, UseTileResult } from 'boardkit-react';

function sizeValue(size: Size): string {
  return `${size.w}x${size.h}`;
}

export interface SizePickerProps {
  readonly size: UseTileResult['size'];
  readonly onPicked: () => void;
}

// Its own component so canSet (a full solver run per size) only runs while the menu is open.
export function SizePicker({ size, onPicked }: SizePickerProps) {
  return (
    <>
      <Menu.Label>Size</Menu.Label>
      <SegmentedControl
        fullWidth
        size="sm"
        radius="md"
        px="xs"
        pb={6}
        value={sizeValue(size.current)}
        data={size.options.map((option) => ({
          value: sizeValue(option.size),
          label: `${option.size.w}×${option.size.h}`,
          disabled: !option.isCurrent && !size.canSet(option.size),
        }))}
        onChange={(value) => {
          const option = size.options.find((candidate) => sizeValue(candidate.size) === value);
          if (option?.isCurrent === false && size.set(option.size).ok) onPicked();
        }}
      />
    </>
  );
}
