import { cell, type Size } from 'boardkit-core';
import type { SizeInput } from './SizeInput.js';

const SIZE_STRING = /^(\d+)x(\d+)$/;

/** Normalizes a `SizeInput` to a `Size`, parsing a `"2x1"` shorthand into `{w, h}` cells. */
export function parseSizeInput(input: SizeInput): Size {
  if (typeof input !== 'string') return input;
  const match = SIZE_STRING.exec(input);
  if (!match?.[1] || !match[2]) throw new Error(`Invalid size "${input}"; expected e.g. "2x1".`);
  return { w: cell(Number(match[1])), h: cell(Number(match[2])) };
}
