import { faker } from '@faker-js/faker';
import { defineWidget } from 'boardkit-react';
import { ServerStatus } from './ServerStatus';

export type ServiceStatus = 'operational' | 'degraded' | 'down';

export interface Service {
  readonly name: string;
  readonly status: ServiceStatus;
  readonly latencyMs: number;
}

export interface ServerStatusProps extends Record<string, unknown> {
  readonly uptimePct: number;
  readonly uptimeHistory: readonly number[];
  readonly services: readonly Service[];
}

function randomService(): Service {
  const status = faker.helpers.weightedArrayElement([
    { value: 'operational' as const, weight: 8 },
    { value: 'degraded' as const, weight: 2 },
    { value: 'down' as const, weight: 1 },
  ]);
  return { name: faker.hacker.noun() + '-svc', status, latencyMs: faker.number.int({ min: 8, max: 420 }) };
}

export const serverStatusWidget = defineWidget<ServerStatusProps>({
  type: 'serverstatus',
  title: 'Server Status',
  sizes: ['2x1', '2x2', '4x2'],
  defaultProps: {
    uptimePct: faker.number.float({ min: 98.5, max: 100, fractionDigits: 2 }),
    uptimeHistory: Array.from({ length: 20 }, () => faker.number.float({ min: 96, max: 100, fractionDigits: 1 })),
    services: Array.from({ length: 6 }, randomService),
  },
  component: ServerStatus,
});
