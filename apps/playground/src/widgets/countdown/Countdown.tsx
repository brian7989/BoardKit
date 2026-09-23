import type { WidgetProps } from 'boardkit-react';
import { Countdown1x1 } from './Countdown1x1';
import { Countdown2x1 } from './Countdown2x1';
import type { CountdownProps } from './manifest';

export function Countdown({ props, cells }: WidgetProps<CountdownProps>) {
  if (cells.w > 1) return <Countdown2x1 props={props} />;
  return <Countdown1x1 props={props} />;
}
