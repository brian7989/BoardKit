import { Text } from '@mantine/core';
import styles from '../widgets.module.css';

export function TaskLabel({ label, done }: { readonly label: string; readonly done: boolean }) {
  return (
    <Text className={`${styles.body} ${styles.fit}`} {...(done ? { td: 'line-through' as const, c: 'dimmed' } : {})}>
      {label}
    </Text>
  );
}
