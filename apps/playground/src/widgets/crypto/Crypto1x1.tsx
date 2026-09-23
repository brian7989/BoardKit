import { Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import type { CryptoProps } from './manifest';

export function Crypto1x1({ props }: { readonly props: CryptoProps }) {
  const up = props.changePct >= 0;
  return (
    <Card justify="space-between">
      <Text className={`${styles.label} ${styles.fit}`} c="gray.5">
        {props.symbol}
      </Text>
      <Text className={styles.hero} fw={800}>
        ${props.price < 1 ? props.price.toFixed(3) : props.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </Text>
      <Text className={styles.body} c={up ? 'teal.4' : 'red.4'} fw={600}>
        {up ? '+' : ''}
        {props.changePct.toFixed(2)}%
      </Text>
    </Card>
  );
}
