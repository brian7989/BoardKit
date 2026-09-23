import type { WidgetProps } from 'boardkit-react';
import { WorldClock1x1 } from './WorldClock1x1';
import { WorldClock2x1 } from './WorldClock2x1';
import { WorldClock2x2 } from './WorldClock2x2';
import type { WorldClockProps } from './manifest';

export function WorldClock({ props, cells }: WidgetProps<WorldClockProps>) {
  if (cells.h > 1) return <WorldClock2x2 props={props} />;
  if (cells.w > 1) return <WorldClock2x1 props={props} />;
  return <WorldClock1x1 props={props} />;
}
