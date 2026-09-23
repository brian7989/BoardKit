import { Sparkline } from '@mantine/charts';
import { Group, Stack, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import { ChangeText } from './ChangeText';
import type { StocksProps } from './manifest';

export function Stocks2x1({ props }: { readonly props: StocksProps }) {
  const ticker = props.watchlist[0];
  if (!ticker) return null;
  const up = ticker.changePct >= 0;
  return (
    <Card>
      <Group justify="space-between" align="stretch" flex={1} wrap="nowrap">
        <Stack gap={2} justify="center">
          <Text className={`${styles.label} ${styles.fit}`} c="dimmed">
            {ticker.symbol}
          </Text>
          <Text className={styles.value} fw={700}>
            ${ticker.price.toFixed(2)}
          </Text>
          <ChangeText changePct={ticker.changePct} className={styles.micro} />
        </Stack>
        <Sparkline w="45%" h="70%" data={[...ticker.history]} color={up ? 'teal' : 'red'} trendColors={{ positive: 'teal', negative: 'red' }} fillOpacity={0.3} curveType="natural" />
      </Group>
    </Card>
  );
}
