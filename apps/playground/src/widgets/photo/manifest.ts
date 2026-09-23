import { faker } from '@faker-js/faker';
import { defineWidget } from 'boardkit-react';
import { Photo } from './Photo';

export interface PhotoProps extends Record<string, unknown> {
  readonly src: string;
  readonly caption: string;
}

export const photoWidget = defineWidget<PhotoProps>({
  type: 'photo',
  title: 'Photo',
  sizes: ['1x1', '2x2'],
  defaultProps: { src: `https://picsum.photos/seed/${faker.string.alphanumeric(8)}/600/600`, caption: faker.location.city() + ', ' + faker.location.country() },
  header: false,
  component: Photo,
});
