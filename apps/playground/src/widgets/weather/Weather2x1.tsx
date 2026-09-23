import { Group, Stack, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import { conditionIcon } from './Weather1x1';
import type { WeatherProps } from './manifest';

export function Weather2x1({ props }: { readonly props: WeatherProps }) {
  return (
    <Card justify="space-between">
      <Text className={`${styles.label} ${styles.fit}`} c="gray.4">
        {props.location}
      </Text>
      <Group justify="space-between" align="flex-end" wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          {conditionIcon(props.condition, 32)}
          <Text className={styles.hero} fw={800}>
            {props.tempF}°
          </Text>
        </Group>
        <Stack gap={0} align="flex-end">
          <Text className={`${styles.body} ${styles.fit}`} c="gray.3">
            {props.condition}
          </Text>
          <Text className={styles.micro} c="gray.5">
            H:{props.high}° L:{props.low}°
          </Text>
        </Stack>
      </Group>
    </Card>
  );
}
