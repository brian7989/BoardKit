import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { City } from './manifest';

dayjs.extend(utc);

export function cityTime(city: City, now: Date): string {
  return dayjs.utc(now).add(city.offsetHours, 'hour').format('h:mm A');
}
