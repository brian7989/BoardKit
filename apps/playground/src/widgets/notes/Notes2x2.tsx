import { Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import type { NotesProps } from './manifest';

export function Notes2x2({ props }: { readonly props: NotesProps }) {
  return (
    <Card style={{ background: 'var(--mantine-color-yellow-0)', borderLeft: '4px solid var(--mantine-color-yellow-6)' }}>
      <Text className={styles.body} c="dark.6" style={{ overflow: 'hidden' }} flex={1}>
        {props.body}
      </Text>
      <Text className={styles.micro} c="dimmed">
        Edited {props.editedAt}
      </Text>
    </Card>
  );
}
