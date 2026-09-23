import { Avatar, Group, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import type { LeaderboardProps } from './manifest';

export function Leaderboard2x2({ props }: { readonly props: LeaderboardProps }) {
  return (
    <Card gap={6} justify="center">
      {props.entries.slice(0, 5).map((entry, index) => (
        <Group key={entry.name} gap={6} wrap="nowrap">
          <Text className={styles.micro} c="dimmed" w={19} ta="right">
            {index + 1}
          </Text>
          <Avatar src={entry.avatar} size={26} radius="xl" />
          <Text className={`${styles.body} ${styles.fit}`} flex={1}>
            {entry.name}
          </Text>
          <Text className={styles.body} fw={700}>
            {entry.score}
          </Text>
        </Group>
      ))}
    </Card>
  );
}
