import { Sparkline } from '@mantine/charts';
import { Group, Stack, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import { categoryOf } from './manifest';
import type { AirQualityProps } from './manifest';

export function AirQuality2x1({ props }: { readonly props: AirQualityProps }) {
  const category = categoryOf(props.aqi);
  return (
    <Card>
      <Group justify="space-between" align="stretch" flex={1} wrap="nowrap">
        <Stack gap={2} justify="center">
          <Text className={`${styles.label} ${styles.fit}`} c="dimmed">
            {props.pollutant}
          </Text>
          <Text className={styles.value} fw={800} c={`${category.color}.7`}>
            {props.aqi}
          </Text>
          <Text className={styles.micro} c={`${category.color}.7`} fw={600}>
            {category.label}
          </Text>
        </Stack>
        <Sparkline w="45%" h="70%" data={[...props.trend]} color={category.color} fillOpacity={0.3} curveType="natural" />
      </Group>
    </Card>
  );
}
