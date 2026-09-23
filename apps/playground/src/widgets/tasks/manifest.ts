import { faker } from '@faker-js/faker';
import { defineWidget } from 'boardkit-react';
import { Tasks } from './Tasks';

export interface Task {
  readonly id: string;
  readonly label: string;
  readonly done: boolean;
}

export interface TasksProps extends Record<string, unknown> {
  readonly items: readonly Task[];
}

function randomTasks(): Task[] {
  return Array.from({ length: 7 }, (_, index) => ({ id: `task-${index}`, label: faker.hacker.phrase(), done: faker.datatype.boolean({ probability: 0.3 }) }));
}

export const tasksWidget = defineWidget<TasksProps>({
  type: 'tasks',
  title: 'Tasks',
  sizes: ['2x1', '2x2'],
  defaultProps: { items: randomTasks() },
  component: Tasks,
});
