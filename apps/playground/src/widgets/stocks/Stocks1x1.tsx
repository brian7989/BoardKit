import { Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import { ChangeText } from './ChangeText';
import type { StocksProps } from './manifest';

export function Stocks1x1({ props }: { readonly props: StocksProps }) {
  const ticker = props.watchlist[0];
  if (!ticker) return null;
  return (
    <Card justify="space-between">
      <Text className={styles.label} c="dimmed">
        {ticker.symbol}
      </Text>
      <Text className={styles.hero} fw={700}>
        ${ticker.price.toFixed(2)}
      </Text>
      <ChangeText changePct={ticker.changePct} />
    </Card>
  );
}
