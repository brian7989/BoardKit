import { Group, Stack, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import { cityTime } from './cityTime';
import { useNow } from './useNow';
import type { WorldClockProps } from './manifest';

export function WorldClock2x1({ props }: { readonly props: WorldClockProps }) {
  const now = useNow();
  return (
    <Card gap={4}>
      <Group justify="space-around" flex={1} align="center">
        {props.cities.slice(0, 2).map((city) => (
          <Stack key={city.name} gap={0} align="center">
            <Text className={`${styles.label} ${styles.fit}`} c="dimmed">
              {city.name}
            </Text>
            <Text className={styles.value} fw={700}>
              {cityTime(city, now)}
            </Text>
          </Stack>
        ))}
      </Group>
    </Card>
  );
}
