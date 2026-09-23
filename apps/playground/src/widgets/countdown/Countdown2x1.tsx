import { Group, Stack, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import { useRemaining } from './useRemaining';
import type { CountdownProps } from './manifest';

function Unit({ value, label }: { readonly value: number; readonly label: string }) {
  return (
    <Stack gap={0} align="center">
      <Text className={styles.value} fw={800} lh={1}>
        {value}
      </Text>
      <Text className={styles.micro} c="dimmed">
        {label}
      </Text>
    </Stack>
  );
}

export function Countdown2x1({ props }: { readonly props: CountdownProps }) {
  const { days, hours, minutes } = useRemaining(props.target);
  return (
    <Card justify="space-between">
      <Text className={`${styles.label} ${styles.fit}`} c="dimmed">
        {props.label}
      </Text>
      <Group justify="space-around">
        <Unit value={days} label="days" />
        <Unit value={hours} label="hrs" />
        <Unit value={minutes} label="min" />
      </Group>
    </Card>
  );
}
