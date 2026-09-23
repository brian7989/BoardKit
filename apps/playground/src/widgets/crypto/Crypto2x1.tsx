import { Sparkline } from '@mantine/charts';
import { Group, Stack, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import type { CryptoProps } from './manifest';

export function Crypto2x1({ props }: { readonly props: CryptoProps }) {
  const up = props.changePct >= 0;
  return (
    <Card>
      <Group justify="space-between" align="stretch" flex={1} wrap="nowrap">
        <Stack gap={2} justify="center">
          <Text className={`${styles.label} ${styles.fit}`} c="gray.5">
            {props.symbol}
          </Text>
          <Text className={styles.value} fw={800}>
            ${props.price < 1 ? props.price.toFixed(3) : props.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
          <Text className={styles.micro} c={up ? 'teal.4' : 'red.4'} fw={600}>
            {up ? '+' : ''}
            {props.changePct.toFixed(2)}%
          </Text>
        </Stack>
        <Sparkline
          w="45%"
          h="70%"
          data={[...props.history]}
          color={up ? 'teal' : 'red'}
          trendColors={{ positive: 'teal', negative: 'red' }}
          fillOpacity={0.3}
          curveType="natural"
        />
      </Group>
    </Card>
  );
}
