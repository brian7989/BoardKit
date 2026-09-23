import type { WidgetProps } from 'boardkit-react';
import { Calendar1x1 } from './Calendar1x1';
import { Calendar1x2 } from './Calendar1x2';
import { Calendar2x2 } from './Calendar2x2';
import type { CalendarProps } from './manifest';

export function Calendar({ props, cells }: WidgetProps<CalendarProps>) {
  if (cells.w > 1) return <Calendar2x2 props={props} />;
  if (cells.h > 1) return <Calendar1x2 props={props} />;
  return <Calendar1x1 />;
}
