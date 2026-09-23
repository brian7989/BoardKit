import { Image } from '@mantine/core';
import { IMAGE_FALLBACK } from '../imageFallback';
import type { PhotoProps } from './manifest';

export function Photo1x1({ props }: { readonly props: PhotoProps }) {
  return <Image src={props.src} fallbackSrc={IMAGE_FALLBACK} alt={props.caption} fit="cover" h="100%" w="100%" radius="md" />;
}
