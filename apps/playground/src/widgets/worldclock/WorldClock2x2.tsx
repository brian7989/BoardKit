import { SimpleGrid, Stack, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import { cityTime } from './cityTime';
import { useNow } from './useNow';
import type { WorldClockProps } from './manifest';

export function WorldClock2x2({ props }: { readonly props: WorldClockProps }) {
  const now = useNow();
  return (
    <Card gap={4}>
      {/* Equal-height rows + centered items spread the four cities evenly, no dead band. */}
      <SimpleGrid cols={2} spacing="xs" flex={1} style={{ gridTemplateRows: 'repeat(2, 1fr)', alignItems: 'center' }}>
        {props.cities.slice(0, 4).map((city) => (
          <Stack key={city.name} gap={0} align="center">
            <Text className={`${styles.label} ${styles.fit}`} c="dimmed">
              {city.name}
            </Text>
            <Text className={styles.body} fw={700}>
              {cityTime(city, now)}
            </Text>
          </Stack>
        ))}
      </SimpleGrid>
    </Card>
  );
}
