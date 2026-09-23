import { faker } from '@faker-js/faker';
import { defineWidget } from 'boardkit-react';
import { ActivityRings } from './ActivityRings';

export interface RingStat {
  readonly value: number;
  readonly goal: number;
}

export interface ActivityRingsProps extends Record<string, unknown> {
  readonly move: RingStat;
  readonly exercise: RingStat;
  readonly stand: RingStat;
}

function stat(max: number): RingStat {
  return { value: faker.number.int({ min: max * 0.3, max: max * 1.15 }), goal: max };
}

export const activityRingsWidget = defineWidget<ActivityRingsProps>({
  type: 'activityrings',
  title: 'Activity',
  sizes: ['1x1', '2x2'],
  defaultProps: { move: stat(500), exercise: stat(30), stand: stat(12) },
  component: ActivityRings,
});
