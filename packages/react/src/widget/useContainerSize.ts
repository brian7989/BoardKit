import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

export interface ContainerSize {
  readonly width: number;
  readonly height: number;
}

const ZERO_SIZE: ContainerSize = { width: 0, height: 0 };

// One observer per widget: each fires only when its own tile is resized, so resizing the
// window recomputes every tile's zoom at most once per size change, not once per frame.
export function useContainerSize<T extends Element>(): readonly [RefObject<T>, ContainerSize] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState(ZERO_SIZE);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // Measured before first paint so widgets never flash at the unscaled design size.
    setSize({ width: el.clientWidth, height: el.clientHeight });
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}
