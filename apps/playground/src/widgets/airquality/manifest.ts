import { faker } from '@faker-js/faker';
import { defineWidget } from 'boardkit-react';
import { AirQuality } from './AirQuality';

export interface AirQualityProps extends Record<string, unknown> {
  readonly aqi: number;
  readonly pollutant: string;
  readonly trend: readonly number[];
}

export function categoryOf(aqi: number): { readonly label: string; readonly color: string } {
  if (aqi <= 50) return { label: 'Good', color: 'teal' };
  if (aqi <= 100) return { label: 'Moderate', color: 'yellow' };
  if (aqi <= 150) return { label: 'Unhealthy (SG)', color: 'orange' };
  return { label: 'Unhealthy', color: 'red' };
}

export const airQualityWidget = defineWidget<AirQualityProps>({
  type: 'airquality',
  title: 'Air Quality',
  sizes: ['1x1', '2x1'],
  defaultProps: {
    aqi: faker.number.int({ min: 8, max: 160 }),
    pollutant: faker.helpers.arrayElement(['PM2.5', 'PM10', 'Ozone', 'NO2']),
    trend: Array.from({ length: 12 }, () => faker.number.int({ min: 8, max: 160 })),
  },
  component: AirQuality,
});
