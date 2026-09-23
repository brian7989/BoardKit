import dayjs from 'dayjs';
import { faker } from '@faker-js/faker';
import { defineWidget } from 'boardkit-react';
import { Countdown } from './Countdown';

export interface CountdownProps extends Record<string, unknown> {
  readonly label: string;
  readonly target: string;
}

export const countdownWidget = defineWidget<CountdownProps>({
  type: 'countdown',
  title: 'Countdown',
  sizes: ['1x1', '2x1'],
  defaultProps: {
    label: faker.helpers.arrayElement(['Vacation', 'Product launch', "New Year's", 'Conference']),
    target: dayjs().add(faker.number.int({ min: 3, max: 60 }), 'day').toISOString(),
  },
  component: Countdown,
});
