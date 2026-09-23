import dayjs from 'dayjs';
import { Group, Stack, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import type { HabitTrackerProps } from './manifest';

export function HabitTracker2x1({ props }: { readonly props: HabitTrackerProps }) {
  const streak = [...props.week].reverse().findIndex((done) => !done);
  return (
    <Card justify="space-between">
      <Group justify="space-between" wrap="nowrap">
        <Text className={`${styles.label} ${styles.fit}`} fw={700}>
          {props.habit}
        </Text>
        <Text className={styles.micro} c="dimmed">
          {streak === -1 ? props.week.length : streak}d streak
        </Text>
      </Group>
      <Group justify="space-between">
        {props.week.map((done, index) => (
          <Stack key={index} gap={2} align="center">
            <Text className={styles.micro} c="dimmed">
              {dayjs()
                .subtract(props.week.length - 1 - index, 'day')
                .format('dd')[0]}
            </Text>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: done ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-gray-3)',
              }}
            />
          </Stack>
        ))}
      </Group>
    </Card>
  );
}
