#!/usr/bin/env node
// Enforces lean comments: no long runs, no long block comments, no `//.` artifacts.

import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const MAX_LINE_RUN = 2;
const MAX_BLOCK_LINES = 5;
const ARTIFACT_PATTERN = /^\s*\/\/\s*\./;
const LINE_COMMENT_PATTERN = /^\s*\/\//;
const BLOCK_START_PATTERN = /^\s*\/\*/;

function checkFile(path) {
  const problems = [];
  const lines = readFileSync(path, 'utf8').split('\n');

  let runStart = -1;
  let runLength = 0;
  let blockStart = -1;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineNo = i + 1;

    if (ARTIFACT_PATTERN.test(line)) {
      problems.push(`${path}:${lineNo}: \`//.\` artifact`);
    }

    if (blockStart === -1 && BLOCK_START_PATTERN.test(line) && !line.includes('*/')) {
      blockStart = lineNo;
    } else if (blockStart !== -1 && line.includes('*/')) {
      const span = lineNo - blockStart + 1;
      if (span > MAX_BLOCK_LINES) problems.push(`${path}:${blockStart}: block comment spans ${span} lines (max ${MAX_BLOCK_LINES})`);
      blockStart = -1;
    }

    if (blockStart === -1 && LINE_COMMENT_PATTERN.test(line)) {
      if (runLength === 0) runStart = lineNo;
      runLength += 1;
    } else if (blockStart === -1) {
      if (runLength > MAX_LINE_RUN) problems.push(`${path}:${runStart}: ${runLength} consecutive // lines (max ${MAX_LINE_RUN})`);
      runLength = 0;
    }
  }
  if (runLength > MAX_LINE_RUN) problems.push(`${path}:${runStart}: ${runLength} consecutive // lines (max ${MAX_LINE_RUN})`);

  return problems;
}

function main() {
  const files = globSync('{packages/*/src,apps/*/src,apps/*/e2e}/**/*.{ts,tsx}');
  const problems = files.flatMap(checkFile);
  if (problems.length > 0) {
    console.error(problems.join('\n'));
    process.exitCode = 1;
    return;
  }
  console.log(`checkComments: ${files.length} files OK.`);
}

main();
