import type { WidgetProps } from 'boardkit-react';
import { ActivityRings1x1 } from './ActivityRings1x1';
import { ActivityRings2x2 } from './ActivityRings2x2';
import type { ActivityRingsProps } from './manifest';

export function ActivityRings({ props, cells }: WidgetProps<ActivityRingsProps>) {
  if (cells.w > 1 && cells.h > 1) return <ActivityRings2x2 props={props} />;
  return <ActivityRings1x1 props={props} />;
}
