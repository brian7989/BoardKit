#!/usr/bin/env node
// Enforces one concept per file: filename matches primary export. Regex-based; no TS parser.

import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { globSync } from 'node:fs';

const CLOSED_SET_SUFFIXES = ['Type', 'Kind', 'Reason', 'Mode', 'Phase', 'Status', 'Key'];
const EXEMPT_BASENAMES = new Set(['index']);

function isTestFile(path) {
  return path.endsWith('.test.ts') || path.endsWith('.test.tsx');
}

function exportedNames(source) {
  const names = new Set();
  const patterns = [
    /export\s+(?:const|function|class)\s+([A-Za-z_$][\w$]*)/g,
    /export\s+(?:interface|type)\s+([A-Za-z_$][\w$]*)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) names.add(match[1]);
  }
  return names;
}

function toScreamingSnakeCase(base) {
  return base.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
}

function checkFile(path) {
  const base = basename(path, extname(path));
  if (EXEMPT_BASENAMES.has(base)) return null;

  const source = readFileSync(path, 'utf8');
  const names = exportedNames(source);
  // A numeric scalar's file keeps the PascalCase concept name, but the constant itself is
  // SCREAMING_SNAKE_CASE (e.g. StateVersion.ts exports STATE_VERSION) — both count as a match.
  if (names.has(base) || names.has(toScreamingSnakeCase(base))) return null;

  const isClosedSet = CLOSED_SET_SUFFIXES.some((suffix) => base.endsWith(suffix));
  if (isClosedSet) {
    return `${path}: closed-set file must export both \`const ${base}\` and \`type ${base}\`.`;
  }
  return `${path}: expected an export named "${base}" matching the file name.`;
}

function main() {
  const files = globSync('packages/*/src/**/*.{ts,tsx}').filter((path) => !isTestFile(path));
  const problems = files.map(checkFile).filter(Boolean);
  if (problems.length > 0) {
    console.error(problems.join('\n'));
    process.exitCode = 1;
    return;
  }
  console.log(`checkFileExports: ${files.length} files OK.`);
}

main();
