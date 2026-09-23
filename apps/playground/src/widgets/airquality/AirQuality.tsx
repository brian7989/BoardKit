import type { WidgetProps } from 'boardkit-react';
import { AirQuality1x1 } from './AirQuality1x1';
import { AirQuality2x1 } from './AirQuality2x1';
import type { AirQualityProps } from './manifest';

export function AirQuality({ props, cells }: WidgetProps<AirQualityProps>) {
  if (cells.w > 1) return <AirQuality2x1 props={props} />;
  return <AirQuality1x1 props={props} />;
}
