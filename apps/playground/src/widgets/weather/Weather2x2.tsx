import { AreaChart } from '@mantine/charts';
import { Group, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import { conditionIcon } from './Weather1x1';
import type { WeatherProps } from './manifest';

export function Weather2x2({ props }: { readonly props: WeatherProps }) {
  return (
    <Card justify="space-between">
      <Group justify="space-between" wrap="nowrap">
        <div>
          <Text className={`${styles.body} ${styles.fit}`}>{props.location}</Text>
          <Text className={styles.micro} c="gray.4">
            {props.condition} · H:{props.high}° L:{props.low}°
          </Text>
        </div>
        <Group gap={6} wrap="nowrap" align="center">
          {conditionIcon(props.condition, 35)}
          <Text className={styles.value} fw={800} style={{ lineHeight: 1 }}>
            {props.tempF}°
          </Text>
        </Group>
      </Group>
      <AreaChart
        h={0}
        flex={1}
        data={[...props.hourly]}
        dataKey="hour"
        series={[{ name: 'temp', color: 'yellow.5' }]}
        withDots={false}
        withXAxis
        withYAxis={false}
        gridAxis="none"
        tickLine="none"
        xAxisProps={{ tick: { fontSize: 9, fill: 'var(--mantine-color-gray-5)' }, interval: 1 }}
        curveType="natural"
      />
    </Card>
  );
}
