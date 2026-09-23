import { Table, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import { StatusBadge } from './StatusBadge';
import type { ServerStatusProps } from './manifest';

export function ServerStatus4x2({ props }: { readonly props: ServerStatusProps }) {
  return (
    <Card gap={4} style={{ overflow: 'auto' }}>
      <Text className={`${styles.label} ${styles.fit}`} c="dimmed">
        {props.uptimePct.toFixed(2)}% uptime over 30 days
      </Text>
      <Table verticalSpacing={4} horizontalSpacing={8} className={styles.micro}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Service</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Latency</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {props.services.map((service) => (
            <Table.Tr key={service.name}>
              <Table.Td>{service.name}</Table.Td>
              <Table.Td>
                <StatusBadge status={service.status} />
              </Table.Td>
              <Table.Td>{service.latencyMs} ms</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
}
