import { Text } from '@mantine/core';
import styles from '../widgets.module.css';

export function ChangeText({ changePct, className }: { readonly changePct: number; readonly className?: string }) {
  const up = changePct >= 0;
  return (
    <Text className={className ?? styles.body} c={up ? 'teal.6' : 'red.6'} fw={600}>
      {up ? '+' : ''}
      {changePct.toFixed(2)}%
    </Text>
  );
}
