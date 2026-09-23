#!/usr/bin/env node
// Next.js App Router needs "use client" first in every entry that exports hooks/components; tsc drops it otherwise.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, '..', 'dist');
const DIRECTIVE = "'use client';\n";
const entries = ['index.js'];

for (const entry of entries) {
  const path = join(distDir, entry);
  const source = readFileSync(path, 'utf8');
  if (source.startsWith(DIRECTIVE)) continue;
  writeFileSync(path, DIRECTIVE + source);
  console.log(`addUseClient: prepended directive to ${entry}`);
}
