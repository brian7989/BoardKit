import type { WidgetProps } from 'boardkit-react';
import { NowPlaying1x1 } from './NowPlaying1x1';
import { NowPlaying2x1 } from './NowPlaying2x1';
import type { NowPlayingProps } from './manifest';

export function NowPlaying({ props, cells }: WidgetProps<NowPlayingProps>) {
  if (cells.w > 1) return <NowPlaying2x1 props={props} />;
  return <NowPlaying1x1 props={props} />;
}
