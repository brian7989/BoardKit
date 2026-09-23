import type { ReactNode } from 'react';
import { Box, Group, RingProgress, Stack, Text } from '@mantine/core';
import styles from '../widgets.module.css';
import { Card } from '../Card';
import type { ActivityRingsProps, RingStat } from './manifest';

// Sized for the fixed 2×2 body (320×288), not measured — see ActivityRings1x1.
const RING_SIZE = 132;
const RING_THICKNESS = 14;

const RINGS = [
  { key: 'move', color: 'red.6', label: 'Move', unit: 'cal', fraction: 1 },
  { key: 'exercise', color: 'lime.6', label: 'Exercise', unit: 'min', fraction: 0.72 },
  { key: 'stand', color: 'cyan.4', label: 'Stand', unit: 'hr', fraction: 0.46 },
] as const;

function Center({ children }: { readonly children: ReactNode }) {
  return (
    <Box pos="absolute" top="50%" left="50%" style={{ transform: 'translate(-50%, -50%)' }}>
      {children}
    </Box>
  );
}

export function ActivityRings2x2({ props }: { readonly props: ActivityRingsProps }) {
  const stats = props as unknown as Record<(typeof RINGS)[number]['key'], RingStat>;

  return (
    <Card gap={4}>
      <Group wrap="nowrap" gap={10} flex={1} align="center">
        {/* Fixed px, not h="100%" + aspectRatio: a flex row can only stretch a square box to the
            *shorter* of its two axes without this, or it grows to fill the row's full height and
            crowds out the label column next to it. */}
        <Box pos="relative" w={RING_SIZE} h={RING_SIZE} style={{ flexShrink: 0 }}>
          {RINGS.map((ring) => (
            <Center key={ring.key}>
              <RingProgress
                size={RING_SIZE * ring.fraction}
                thickness={RING_THICKNESS * ring.fraction}
                roundCaps
                sections={[{ value: Math.min(100, (stats[ring.key].value / stats[ring.key].goal) * 100), color: ring.color }]}
              />
            </Center>
          ))}
        </Box>
        <Stack gap={4} flex={1} style={{ minWidth: 0 }}>
          {RINGS.map((ring) => (
            <Stack key={ring.key} gap={0}>
              <Text className={`${styles.micro} ${styles.fit}`} c={ring.color} fw={700} tt="uppercase">
                {ring.label}
              </Text>
              <Text className={`${styles.body} ${styles.fit}`} fw={600}>
                {stats[ring.key].value}/{stats[ring.key].goal} {ring.unit}
              </Text>
            </Stack>
          ))}
        </Stack>
      </Group>
    </Card>
  );
}
