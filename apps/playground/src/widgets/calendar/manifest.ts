import dayjs from 'dayjs';
import { faker } from '@faker-js/faker';
import { defineWidget } from 'boardkit-react';
import { Calendar } from './Calendar';

export interface CalendarEvent {
  readonly date: string;
  readonly time: string;
  readonly title: string;
}

export interface CalendarProps extends Record<string, unknown> {
  readonly events: readonly CalendarEvent[];
}

function randomEvents(): CalendarEvent[] {
  const titles = ['Standup', 'Design review', '1:1 with manager', 'Dentist', 'Team lunch', 'Sprint planning', 'Gym', 'Flight to NYC'];
  return Array.from({ length: 10 }, () => ({
    date: dayjs().add(faker.number.int({ min: 0, max: 24 }), 'day').format('YYYY-MM-DD'),
    time: dayjs().hour(faker.number.int({ min: 7, max: 19 })).minute(faker.helpers.arrayElement([0, 15, 30, 45])).format('h:mm A'),
    title: faker.helpers.arrayElement(titles),
  })).sort((a, b) => a.date.localeCompare(b.date));
}

export const calendarWidget = defineWidget<CalendarProps>({
  type: 'calendar',
  title: 'Calendar',
  sizes: ['1x1', '1x2', '2x2'],
  defaultProps: { events: randomEvents() },
  component: Calendar,
});
