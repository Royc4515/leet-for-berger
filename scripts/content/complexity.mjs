#!/usr/bin/env node
/**
 * Extracts the best known time and space complexity per LeetCode problem number from the
 * kamyu104/LeetCode-Solutions tables (MIT) into content/index/complexity.json.
 *
 * These are reference values for LeetCode's version of a problem. Our own `growth` target stays
 * authoritative for our variants (ADR 0004); the UI shows this as "best known" with attribution.
 *
 * Usage: bash scripts/content/fetch-sources.sh && node scripts/content/complexity.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(ROOT, 'content', '.cache', 'kamyu104');
const FILES = ['0001-1000.md', '1001-2000.md', '2001-3000.md', 'README.md'];

/** `_O(n)_` -> `O(n)`; empty or dash cells become null. */
function clean(cell) {
  const v = cell.trim().replace(/^_+|_+$/g, '').replace(/\s+/g, ' ').trim();
  return v && v !== '-' ? v : null;
}

/**
 * Parses table rows of the form `0136 | [Title](url) | [C++](...) | _O(n)_ | _O(1)_ | Easy | ...`.
 * @param {string} md
 * @returns {Map<number, {time: string|null, space: string|null}>}
 */
export function parseTables(md) {
  const out = new Map();
  for (const line of md.split('\n')) {
    const m = line.match(/^\|?\s*(\d{1,4})\s*\|/);
    if (!m) continue;
    const cells = line.replace(/^\|/, '').split('|');
    if (cells.length < 5) continue;
    const number = Number(m[1]);
    // First table wins: the archive files are listed before README, and a problem appears once per file.
    if (!out.has(number)) out.set(number, { time: clean(cells[3]), space: clean(cells[4]) });
  }
  return out;
}

function main() {
  const all = new Map();
  for (const f of FILES) {
    const path = join(DIR, f);
    if (!existsSync(path)) throw new Error(`missing ${path}; run scripts/content/fetch-sources.sh`);
    for (const [n, v] of parseTables(readFileSync(path, 'utf8'))) if (!all.has(n)) all.set(n, v);
  }
  const rows = Object.fromEntries([...all].sort((a, b) => a[0] - b[0]));
  const doc = {
    source: 'https://github.com/kamyu104/LeetCode-Solutions',
    license: 'MIT',
    note: 'Best known complexity for the LeetCode version, keyed by problem number.',
    problems: rows,
  };
  writeFileSync(join(ROOT, 'content', 'index', 'complexity.json'), JSON.stringify(doc) + '\n');
  console.log(`${all.size} problems -> content/index/complexity.json`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
