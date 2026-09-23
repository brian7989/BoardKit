import { Avatar, Group, Table, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import type { LeaderboardProps } from './manifest';

export function Leaderboard4x2({ props }: { readonly props: LeaderboardProps }) {
  return (
    <Card gap={4} style={{ overflow: 'auto' }}>
      <Table verticalSpacing={4} horizontalSpacing={8} className={styles.micro}>
        <Table.Tbody>
          {props.entries.map((entry, index) => (
            <Table.Tr key={entry.name}>
              <Table.Td w={24}>{index + 1}</Table.Td>
              <Table.Td>
                <Group gap={6} wrap="nowrap">
                  <Avatar src={entry.avatar} size="sm" radius="xl" />
                  <Text className={styles.body}>{entry.name}</Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Text className={styles.body} fw={700}>
                  {entry.score}
                </Text>
              </Table.Td>
              <Table.Td c={entry.deltaPct >= 0 ? 'teal.6' : 'red.6'}>
                {entry.deltaPct >= 0 ? '+' : ''}
                {entry.deltaPct.toFixed(1)}%
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
}
