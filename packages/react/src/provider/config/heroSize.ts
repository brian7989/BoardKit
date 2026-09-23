import type { Size } from 'boardkit-core';
import type { WidgetManifest } from '../../widget/index.js';

interface Grid {
  readonly cols: number;
  readonly rows: number;
}

/** The largest of a widget's sizes that still fits `grid`, or its largest size if none do. */
export function heroSize(manifest: WidgetManifest, grid: Grid): Size {
  const fits = manifest.sizes.filter((size) => size.w <= grid.cols && size.h <= grid.rows);
  const pool = fits.length > 0 ? fits : manifest.sizes;
  return pool.reduce((best, size) => (size.w * size.h > best.w * best.h ? size : best));
}
