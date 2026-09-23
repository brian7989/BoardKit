import { Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import { useRemaining } from './useRemaining';
import type { CountdownProps } from './manifest';

export function Countdown1x1({ props }: { readonly props: CountdownProps }) {
  const { days } = useRemaining(props.target);
  return (
    <Card justify="space-between">
      <Text className={`${styles.label} ${styles.fit}`} c="dimmed">
        {props.label}
      </Text>
      <div>
        <Text className={styles.hero} fw={800} lh={1}>
          {days}
        </Text>
        <Text className={styles.micro} c="dimmed">
          days
        </Text>
      </div>
    </Card>
  );
}
