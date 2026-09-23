import type { WidgetProps } from 'boardkit-react';
import { HabitTracker2x1 } from './HabitTracker2x1';
import { HabitTracker2x2 } from './HabitTracker2x2';
import type { HabitTrackerProps } from './manifest';

export function HabitTracker({ props, cells }: WidgetProps<HabitTrackerProps>) {
  if (cells.h > 1) return <HabitTracker2x2 props={props} />;
  return <HabitTracker2x1 props={props} />;
}
