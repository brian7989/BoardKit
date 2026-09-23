import dayjs from 'dayjs';
import { Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';

export function Calendar1x1() {
  const today = dayjs();
  return (
    <Card align="center" justify="center" gap={0}>
      <Text className={styles.label} c="red.6" fw={700} tt="uppercase">
        {today.format('ddd')}
      </Text>
      <Text className={styles.hero} fw={800} lh={1}>
        {today.format('D')}
      </Text>
    </Card>
  );
}
