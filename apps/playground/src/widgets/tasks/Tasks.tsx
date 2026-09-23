import { useState } from 'react';
import type { WidgetProps } from 'boardkit-react';
import { Tasks2x1 } from './Tasks2x1';
import { Tasks2x2 } from './Tasks2x2';
import type { Task, TasksProps } from './manifest';

// Checked state lives here, not in props, since toggling a task shouldn't dispatch a board op.
export function Tasks({ props, cells }: WidgetProps<TasksProps>) {
  const [done, setDone] = useState<ReadonlySet<string>>(() => new Set(props.items.filter((task) => task.done).map((task) => task.id)));
  const toggle = (id: string) =>
    setDone((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const items: readonly Task[] = props.items.map((task) => ({ ...task, done: done.has(task.id) }));

  if (cells.h > 1) return <Tasks2x2 items={items} toggle={toggle} />;
  return <Tasks2x1 items={items} toggle={toggle} />;
}
