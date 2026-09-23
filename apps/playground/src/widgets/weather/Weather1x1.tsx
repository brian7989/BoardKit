import { Group, Text } from '@mantine/core';
import { IconCloud, IconCloudFog, IconCloudRain, IconSun, IconWind } from '@tabler/icons-react';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import type { WeatherProps } from './manifest';

export function conditionIcon(condition: string, size: string | number) {
  if (condition === 'Sunny') return <IconSun size={size} color="var(--mantine-color-yellow-4)" />;
  if (condition === 'Rainy') return <IconCloudRain size={size} color="var(--mantine-color-blue-3)" />;
  if (condition === 'Foggy') return <IconCloudFog size={size} color="var(--mantine-color-gray-4)" />;
  if (condition === 'Windy') return <IconWind size={size} color="var(--mantine-color-gray-3)" />;
  return <IconCloud size={size} color="var(--mantine-color-gray-3)" />;
}

export function Weather1x1({ props }: { readonly props: WeatherProps }) {
  return (
    <Card justify="space-between">
      <Group justify="space-between" wrap="nowrap">
        <Text className={`${styles.label} ${styles.fit}`} c="gray.4">
          {props.location}
        </Text>
        {conditionIcon(props.condition, 35)}
      </Group>
      <Text className={styles.hero} fw={800}>
        {props.tempF}°
      </Text>
    </Card>
  );
}
