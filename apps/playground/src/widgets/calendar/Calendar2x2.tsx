import { Calendar as MantineCalendar } from '@mantine/dates';
import { Card } from '../Card';
import type { CalendarProps } from './manifest';

export function Calendar2x2({ props }: { readonly props: CalendarProps }) {
  const eventDates = new Set(props.events.map((event) => event.date));
  return (
    <Card justify="center">
      <MantineCalendar
        static
        highlightToday
        fullWidth
        size="xs"
        getDayProps={(date) => (eventDates.has(date) ? { style: { fontWeight: 700, textDecoration: 'underline' } } : {})}
      />
    </Card>
  );
}
