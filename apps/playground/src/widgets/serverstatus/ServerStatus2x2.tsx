import { Group, Stack, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import { StatusBadge } from './StatusBadge';
import type { ServerStatusProps } from './manifest';

export function ServerStatus2x2({ props }: { readonly props: ServerStatusProps }) {
  return (
    <Card gap={6}>
      <Text className={`${styles.label} ${styles.fit}`} c="dimmed">
        {props.uptimePct.toFixed(2)}% uptime
      </Text>
      <Stack gap={6} style={{ overflow: 'hidden' }}>
        {props.services.slice(0, 4).map((service) => (
          <Group key={service.name} justify="space-between" wrap="nowrap">
            <Text className={`${styles.body} ${styles.fit}`}>{service.name}</Text>
            <StatusBadge status={service.status} />
          </Group>
        ))}
      </Stack>
    </Card>
  );
}
