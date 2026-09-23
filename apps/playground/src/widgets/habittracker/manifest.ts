import dayjs from 'dayjs';
import { faker } from '@faker-js/faker';
import { defineWidget } from 'boardkit-react';
import { HabitTracker } from './HabitTracker';

export interface HabitTrackerProps extends Record<string, unknown> {
  readonly habit: string;
  readonly week: readonly boolean[];
  readonly heatmap: Record<string, number>;
}

function randomHeatmap(): Record<string, number> {
  const heatmap: Record<string, number> = {};
  for (let day = 0; day < 90; day += 1) {
    if (faker.datatype.boolean({ probability: 0.75 })) heatmap[dayjs().subtract(day, 'day').format('YYYY-MM-DD')] = faker.number.int({ min: 1, max: 4 });
  }
  return heatmap;
}

export const habitTrackerWidget = defineWidget<HabitTrackerProps>({
  type: 'habittracker',
  title: 'Habit Tracker',
  sizes: ['2x1', '2x2'],
  defaultProps: { habit: 'Meditate', week: Array.from({ length: 7 }, () => faker.datatype.boolean({ probability: 0.7 })), heatmap: randomHeatmap() },
  component: HabitTracker,
});
