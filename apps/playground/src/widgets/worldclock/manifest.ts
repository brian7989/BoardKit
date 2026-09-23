import { defineWidget } from 'boardkit-react';
import { WorldClock } from './WorldClock';

export interface City {
  readonly name: string;
  readonly offsetHours: number;
}

export interface WorldClockProps extends Record<string, unknown> {
  readonly cities: readonly City[];
}

export const worldClockWidget = defineWidget<WorldClockProps>({
  type: 'worldclock',
  title: 'World Clock',
  sizes: ['1x1', '2x1', '2x2'],
  defaultProps: {
    cities: [
      { name: 'Tokyo', offsetHours: 9 },
      { name: 'London', offsetHours: 0 },
      { name: 'New York', offsetHours: -4 },
      { name: 'Sydney', offsetHours: 11 },
    ],
  },
  component: WorldClock,
});
