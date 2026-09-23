import { useEffect } from 'react';
import type { RefObject } from 'react';

// Coalesces ResizeObserver bursts onto a single animation frame before reporting a width.
export function useContainerWidth(ref: RefObject<HTMLElement | null>, onWidth: (width: number) => void): void {
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => onWidth(element.getBoundingClientRect().width));
    });
    observer.observe(element);
    onWidth(element.getBoundingClientRect().width);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ref, onWidth]);
}
