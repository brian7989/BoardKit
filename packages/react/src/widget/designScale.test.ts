import { describe, expect, it } from 'vitest';
import { designScale } from './designScale.js';

describe('designScale', () => {
  it('zooms a real cell up to a larger design canvas', () => {
    const result = designScale({ cells: { w: 2, h: 1 }, designCellSizePx: 160, containerWidthPx: 400, containerHeightPx: 200 });
    expect(result.zoom).toBeCloseTo(1.25);
    expect(result.width).toBeCloseTo(320);
    expect(result.height).toBeCloseTo(160);
  });

  it('zooms a real cell down to a smaller design canvas', () => {
    const result = designScale({ cells: { w: 1, h: 1 }, designCellSizePx: 160, containerWidthPx: 80, containerHeightPx: 80 });
    expect(result.zoom).toBeCloseTo(0.5);
    expect(result.width).toBeCloseTo(160);
    expect(result.height).toBeCloseTo(160);
  });

  it('falls back to 1:1 design px before the container has been measured', () => {
    const result = designScale({ cells: { w: 2, h: 2 }, designCellSizePx: 160, containerWidthPx: 0, containerHeightPx: 0 });
    expect(result).toEqual({ width: 320, height: 320, zoom: 1 });
  });
});
