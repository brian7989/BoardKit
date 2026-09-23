import { Group, UnstyledButton } from '@mantine/core';
import { useBoardList } from 'boardkit-react';

// Floats over the board's bottom edge so it never takes layout space from the grid.
export function PageDots() {
  const { boards, select } = useBoardList();
  if (boards.length <= 1) return null;

  return (
    <Group
      role="tablist"
      aria-label="Boards"
      gap={2}
      px={6}
      pos="absolute"
      bottom={10}
      left="50%"
      style={{
        transform: 'translateX(-50%)',
        zIndex: 20,
        borderRadius: 999,
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 1px 4px rgba(15, 23, 42, 0.12)',
      }}
    >
      {boards.map((board) => (
        <UnstyledButton
          key={board.id}
          role="tab"
          aria-selected={board.isActive}
          aria-label={`Board ${board.index + 1}`}
          onClick={() => select(board.id)}
          px={3}
          py={7}
        >
          <div
            style={{
              height: 6,
              width: board.isActive ? 16 : 6,
              borderRadius: 999,
              background: board.isActive ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-5)',
              transition: 'width 150ms ease',
            }}
          />
        </UnstyledButton>
      ))}
    </Group>
  );
}
