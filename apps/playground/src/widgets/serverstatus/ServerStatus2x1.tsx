import { Sparkline } from '@mantine/charts';
import { Group, Stack, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import type { ServerStatusProps } from './manifest';

export function ServerStatus2x1({ props }: { readonly props: ServerStatusProps }) {
  return (
    <Card>
      <Group justify="space-between" align="stretch" flex={1} wrap="nowrap">
        <Stack gap={2} justify="center">
          <Text className={`${styles.label} ${styles.fit}`} c="dimmed">
            Uptime (30d)
          </Text>
          <Text className={styles.value} fw={700} c="teal.6">
            {props.uptimePct.toFixed(2)}%
          </Text>
        </Stack>
        <Sparkline w="50%" h="70%" data={[...props.uptimeHistory]} color="teal" fillOpacity={0.25} curveType="natural" />
      </Group>
    </Card>
  );
}
