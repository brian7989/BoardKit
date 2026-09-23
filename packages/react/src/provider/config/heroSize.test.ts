import { describe, expect, it } from 'vitest';
import { cell } from 'boardkit-core';
import { defineWidget } from '../../widget/index.js';
import { heroSize } from './heroSize.js';

const size = (w: number, h: number) => ({ w: cell(w), h: cell(h) });
const manifest = defineWidget({ type: 'w', title: 'W', sizes: ['1x1', '2x2', '4x2'], component: () => null });

describe('heroSize', () => {
  it('picks the largest size that fits the grid', () => {
    expect(heroSize(manifest, { cols: 6, rows: 4 })).toEqual(size(4, 2));
    expect(heroSize(manifest, { cols: 2, rows: 4 })).toEqual(size(2, 2));
  });

  it('falls back to the largest size when none fit', () => {
    expect(heroSize(manifest, { cols: 0, rows: 0 })).toEqual(size(4, 2));
  });
});
