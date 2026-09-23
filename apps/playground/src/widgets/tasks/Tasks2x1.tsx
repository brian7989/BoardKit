import { Checkbox, Stack } from '@mantine/core';
import { Card } from '../Card';
import { TaskLabel } from './TaskLabel';
import type { Task } from './manifest';

export interface TasksViewProps {
  readonly items: readonly Task[];
  readonly toggle: (id: string) => void;
}

export function Tasks2x1({ items, toggle }: TasksViewProps) {
  return (
    <Card gap={4} justify="center">
      <Stack gap={4} style={{ overflow: 'hidden' }}>
        {items.slice(0, 4).map((task) => (
          <Checkbox key={task.id} size="xs" checked={task.done} onChange={() => toggle(task.id)} label={<TaskLabel label={task.label} done={task.done} />} />
        ))}
      </Stack>
    </Card>
  );
}
