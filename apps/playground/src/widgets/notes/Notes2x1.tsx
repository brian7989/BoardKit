import { Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import type { NotesProps } from './manifest';

export function Notes2x1({ props }: { readonly props: NotesProps }) {
  return (
    <Card justify="center" style={{ background: 'var(--mantine-color-yellow-0)', borderLeft: '4px solid var(--mantine-color-yellow-6)' }}>
      <Text className={styles.body} c="dark.6" lineClamp={2}>
        {props.body}
      </Text>
    </Card>
  );
}
