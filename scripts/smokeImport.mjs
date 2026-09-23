#!/usr/bin/env node
// Guards against a regression to extensionless relative imports: after a build, dist/index.js
// for each published package must be importable by plain Node with no bundler or loader flags.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

const packages = [
  {
    name: 'boardkit-core',
    entry: join(repoRoot, 'packages/core/dist/index.js'),
    requiredExports: ['createEngine', 'OpType', 'boardId'],
    useClient: false,
  },
  {
    name: 'boardkit-react',
    entry: join(repoRoot, 'packages/react/dist/index.js'),
    requiredExports: ['BoardProvider', 'Board', 'useTile', 'defineBoards'],
    useClient: true,
  },
];

async function checkPackage(pkg) {
  let moduleExports;
  try {
    moduleExports = await import(pkg.entry);
  } catch (error) {
    throw new Error(`Failed to import ${pkg.name} from ${pkg.entry}: ${error.message}`);
  }

  const missing = pkg.requiredExports.filter((name) => !(name in moduleExports));
  if (missing.length > 0) {
    throw new Error(`${pkg.name} is missing expected export(s): ${missing.join(', ')}`);
  }

  const hasDirective = readFileSync(pkg.entry, 'utf8').startsWith("'use client';\n");
  if (pkg.useClient && !hasDirective) {
    throw new Error(`${pkg.name} is missing the leading "use client" directive in ${pkg.entry}`);
  }
  if (!pkg.useClient && hasDirective) {
    throw new Error(`${pkg.name} should stay directive-free but has "use client" in ${pkg.entry}`);
  }
}

async function main() {
  const failures = [];
  for (const pkg of packages) {
    try {
      await checkPackage(pkg);
      console.log(`ok: ${pkg.name} imported successfully with all expected exports`);
    } catch (error) {
      failures.push(error.message);
    }
  }

  if (failures.length > 0) {
    console.error('Smoke import check failed:');
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
}

await main();
