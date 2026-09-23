import { px, type Px, type Rect } from 'boardkit-core';

export const ZERO_RECT: Rect<Px> = { x: px(0), y: px(0), w: px(0), h: px(0) };

export function measureRect(el: HTMLElement | null): Rect<Px> {
  if (!el) return ZERO_RECT;
  const rect = el.getBoundingClientRect();
  return { x: px(rect.left), y: px(rect.top), w: px(rect.width), h: px(rect.height) };
}
