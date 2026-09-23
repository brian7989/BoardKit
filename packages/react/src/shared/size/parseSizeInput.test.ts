import { describe, expect, it } from 'vitest';
import { cell } from 'boardkit-core';
import { parseSizeInput } from './parseSizeInput.js';

describe('parseSizeInput', () => {
  it('passes a Size object through unchanged', () => {
    const size = { w: cell(2), h: cell(1) };
    expect(parseSizeInput(size)).toBe(size);
  });

  it('parses a "WxH" string into a Size', () => {
    expect(parseSizeInput('2x1')).toEqual({ w: cell(2), h: cell(1) });
  });

  it('parses multi-digit dimensions', () => {
    expect(parseSizeInput('12x10')).toEqual({ w: cell(12), h: cell(10) });
  });

  it('throws on a malformed size string', () => {
    // @ts-expect-error '2by1' fails the SizeInput template-literal type; this checks the runtime guard.
    expect(() => parseSizeInput('2by1')).toThrow(/Invalid size/);
  });
});
