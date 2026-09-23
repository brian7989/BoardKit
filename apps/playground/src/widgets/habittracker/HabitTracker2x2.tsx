import dayjs from 'dayjs';
import { Heatmap } from '@mantine/charts';
import { Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import type { HabitTrackerProps } from './manifest';

export function HabitTracker2x2({ props }: { readonly props: HabitTrackerProps }) {
  return (
    <Card gap={6}>
      <Text className={`${styles.label} ${styles.fit}`} fw={700}>
        {props.habit} · last 90 days
      </Text>
      <Heatmap
        data={props.heatmap}
        startDate={dayjs().subtract(89, 'day').toDate()}
        endDate={new Date()}
        withTooltip
        getTooltipLabel={({ date, value }) => `${date}: ${value ?? 0}`}
        colors={['var(--mantine-color-gray-2)', 'var(--mantine-color-teal-3)', 'var(--mantine-color-teal-5)', 'var(--mantine-color-teal-7)', 'var(--mantine-color-teal-9)']}
        rectSize={8}
        gap={2}
      />
    </Card>
  );
}
