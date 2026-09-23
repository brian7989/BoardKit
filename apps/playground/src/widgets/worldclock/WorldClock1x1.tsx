import { Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import { cityTime } from './cityTime';
import { useNow } from './useNow';
import type { WorldClockProps } from './manifest';

export function WorldClock1x1({ props }: { readonly props: WorldClockProps }) {
  const now = useNow();
  const city = props.cities[0];
  if (!city) return null;
  return (
    <Card justify="space-between">
      <Text className={`${styles.label} ${styles.fit}`} c="dimmed">
        {city.name}
      </Text>
      <Text className={styles.hero} fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {cityTime(city, now)}
      </Text>
    </Card>
  );
}
