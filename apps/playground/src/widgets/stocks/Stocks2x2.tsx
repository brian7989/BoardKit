import { Sparkline } from '@mantine/charts';
import { Table, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import { ChangeText } from './ChangeText';
import type { StocksProps } from './manifest';

export function Stocks2x2({ props }: { readonly props: StocksProps }) {
  return (
    <Card gap={4} style={{ overflow: 'auto' }}>
      <Table verticalSpacing={4} horizontalSpacing={6} className={styles.micro}>
        <Table.Tbody>
          {props.watchlist.map((ticker) => (
            <Table.Tr key={ticker.symbol}>
              <Table.Td>
                <Text className={styles.body} fw={600}>
                  {ticker.symbol}
                </Text>
              </Table.Td>
              <Table.Td>
                <Sparkline
                  w={50}
                  h={20}
                  data={[...ticker.history]}
                  color={ticker.changePct >= 0 ? 'teal' : 'red'}
                  trendColors={{ positive: 'teal', negative: 'red' }}
                  curveType="natural"
                />
              </Table.Td>
              <Table.Td>
                <Text className={styles.body}>${ticker.price.toFixed(2)}</Text>
              </Table.Td>
              <Table.Td>
                <ChangeText changePct={ticker.changePct} className={styles.micro} />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
}
