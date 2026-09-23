import type { WidgetProps } from 'boardkit-react';
import { Stocks1x1 } from './Stocks1x1';
import { Stocks2x1 } from './Stocks2x1';
import { Stocks2x2 } from './Stocks2x2';
import type { StocksProps } from './manifest';

export function Stocks({ props, cells }: WidgetProps<StocksProps>) {
  if (cells.h > 1) return <Stocks2x2 props={props} />;
  if (cells.w > 1) return <Stocks2x1 props={props} />;
  return <Stocks1x1 props={props} />;
}
