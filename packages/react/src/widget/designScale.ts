export interface DesignScaleInput {
  readonly cells: { readonly w: number; readonly h: number };
  readonly designCellSizePx: number;
  readonly containerWidthPx: number;
  readonly containerHeightPx: number;
}

export interface DesignScaleResult {
  readonly width: number;
  readonly height: number;
  readonly zoom: number;
}

const IDLE_ZOOM = 1;

// Before the container has been measured (or in a non-browser test), fall back to 1:1 design
// px rather than a zoom of zero, so nothing flashes at zero size.
export function designScale(input: DesignScaleInput): DesignScaleResult {
  const { cells, designCellSizePx, containerWidthPx, containerHeightPx } = input;
  const width = cells.w * designCellSizePx;
  const height = cells.h * designCellSizePx;
  if (containerWidthPx <= 0 || cells.w <= 0) return { width, height, zoom: IDLE_ZOOM };

  const zoom = containerWidthPx / width;
  return { width: containerWidthPx / zoom, height: containerHeightPx / zoom, zoom };
}
