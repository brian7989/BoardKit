import { Checkbox, Stack, Text } from '@mantine/core';
import { Card } from '../Card';
import styles from '../widgets.module.css';
import { TaskLabel } from './TaskLabel';
import type { TasksViewProps } from './Tasks2x1';

export function Tasks2x2({ items, toggle }: TasksViewProps) {
  const remaining = items.filter((task) => !task.done).length;
  return (
    <Card gap={4}>
      <Text className={`${styles.micro} ${styles.fit}`} c="dimmed">
        {remaining} left
      </Text>
      <Stack gap={6} style={{ overflow: 'auto' }}>
        {items.map((task) => (
          <Checkbox key={task.id} size="sm" checked={task.done} onChange={() => toggle(task.id)} label={<TaskLabel label={task.label} done={task.done} />} />
        ))}
      </Stack>
    </Card>
  );
}
