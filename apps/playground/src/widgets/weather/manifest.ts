import { faker } from '@faker-js/faker';
import { defineWidget } from 'boardkit-react';
import { Weather } from './Weather';

interface HourlyTemp {
  readonly hour: string;
  readonly temp: number;
}

export interface WeatherProps extends Record<string, unknown> {
  readonly location: string;
  readonly condition: string;
  readonly tempF: number;
  readonly high: number;
  readonly low: number;
  readonly hourly: readonly HourlyTemp[];
}

const CONDITIONS = ['Sunny', 'Partly cloudy', 'Cloudy', 'Rainy', 'Foggy', 'Windy'] as const;

function randomProps(): WeatherProps {
  const tempF = faker.number.int({ min: 42, max: 88 });
  const hourly = Array.from({ length: 8 }, (_, index) => ({
    hour: `${((index * 3 + 8) % 24).toString().padStart(2, '0')}:00`,
    temp: tempF + faker.number.int({ min: -12, max: 8 }),
  }));
  return {
    location: faker.location.city(),
    condition: faker.helpers.arrayElement(CONDITIONS),
    tempF,
    high: tempF + faker.number.int({ min: 2, max: 8 }),
    low: tempF - faker.number.int({ min: 2, max: 10 }),
    hourly,
  };
}

export const weatherWidget = defineWidget<WeatherProps>({
  type: 'weather',
  title: 'Weather',
  sizes: ['1x1', '2x1', '2x2'],
  defaultProps: randomProps(),
  surface: { background: 'var(--mantine-color-dark-7)', color: 'white' },
  component: Weather,
});
