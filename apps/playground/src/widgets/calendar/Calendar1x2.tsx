import dayjs from 'dayjs';
import { Stack, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import type { CalendarProps } from './manifest';

export function Calendar1x2({ props }: { readonly props: CalendarProps }) {
  const upcoming = props.events.filter((event) => !dayjs(event.date).isBefore(dayjs(), 'day')).slice(0, 5);
  return (
    <Card gap={6}>
      <Text className={`${styles.label} ${styles.fit}`} fw={700}>
        {dayjs().format('MMM D')}
      </Text>
      <Stack gap={4} style={{ overflow: 'hidden' }}>
        {upcoming.map((event, index) => (
          <Stack key={`${event.date}-${event.title}-${index}`} gap={0}>
            <Text className={`${styles.body} ${styles.fit}`} fw={600}>
              {event.title}
            </Text>
            <Text className={styles.micro} c="dimmed">
              {dayjs(event.date).format('ddd')} {event.time}
            </Text>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
