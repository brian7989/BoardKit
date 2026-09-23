import { faker } from '@faker-js/faker';
import { defineWidget } from 'boardkit-react';
import { NowPlaying } from './NowPlaying';

export interface NowPlayingProps extends Record<string, unknown> {
  readonly track: string;
  readonly artist: string;
  readonly art: string;
  readonly progress: number;
  readonly durationSec: number;
}

export const nowPlayingWidget = defineWidget<NowPlayingProps>({
  type: 'nowplaying',
  title: 'Now Playing',
  sizes: ['1x1', '2x1'],
  defaultProps: {
    track: faker.music.songName(),
    artist: faker.person.fullName(),
    art: `https://picsum.photos/seed/${faker.string.alphanumeric(8)}/300/300`,
    progress: faker.number.float({ min: 0.1, max: 0.9, fractionDigits: 2 }),
    durationSec: faker.number.int({ min: 150, max: 260 }),
  },
  component: NowPlaying,
});
