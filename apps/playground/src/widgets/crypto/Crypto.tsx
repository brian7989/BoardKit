import type { WidgetProps } from 'boardkit-react';
import { Crypto1x1 } from './Crypto1x1';
import { Crypto2x1 } from './Crypto2x1';
import type { CryptoProps } from './manifest';

export function Crypto({ props, cells }: WidgetProps<CryptoProps>) {
  if (cells.w > 1) return <Crypto2x1 props={props} />;
  return <Crypto1x1 props={props} />;
}
