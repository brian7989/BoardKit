import type { WidgetProps } from 'boardkit-react';
import { Weather1x1 } from './Weather1x1';
import { Weather2x1 } from './Weather2x1';
import { Weather2x2 } from './Weather2x2';
import type { WeatherProps } from './manifest';

export function Weather({ props, cells }: WidgetProps<WeatherProps>) {
  if (cells.h > 1) return <Weather2x2 props={props} />;
  if (cells.w > 1) return <Weather2x1 props={props} />;
  return <Weather1x1 props={props} />;
}
