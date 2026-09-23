import type { WidgetProps } from 'boardkit-react';
import { Photo1x1 } from './Photo1x1';
import { Photo2x2 } from './Photo2x2';
import type { PhotoProps } from './manifest';

export function Photo({ props, cells, name }: WidgetProps<PhotoProps>) {
  if (cells.h > 1) return <Photo2x2 name={name} props={props} />;
  return <Photo1x1 props={props} />;
}
