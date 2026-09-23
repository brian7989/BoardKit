import type { WidgetProps } from 'boardkit-react';
import { ServerStatus2x1 } from './ServerStatus2x1';
import { ServerStatus2x2 } from './ServerStatus2x2';
import { ServerStatus4x2 } from './ServerStatus4x2';
import type { ServerStatusProps } from './manifest';

export function ServerStatus({ props, cells }: WidgetProps<ServerStatusProps>) {
  if (cells.w > 2) return <ServerStatus4x2 props={props} />;
  if (cells.h > 1) return <ServerStatus2x2 props={props} />;
  return <ServerStatus2x1 props={props} />;
}
