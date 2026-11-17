#!/usr/bin/env node
/**
 * Stages third-party reference solutions for problems in the index, so authors adapt existing
 * code instead of writing 8 languages from scratch.
 *
 * Sources (both cloned lazily into content/.cache/solutions, gitignored):
 *   doocs/leetcode    CC BY-SA 4.0  py, java, cpp, go, ts, js, cs, c (coverage varies)
 *   walkccc/LeetCode  MIT           py, java, cpp (fallback when doocs lacks a language)
 *
 * Output: content/.cache/imports/<slug>/<our file name> with an attribution header, plus
 * SOURCES.json listing where every file came from and under which license. Staged files are raw
 * material: they still use LeetCode's signatures and semantics and must be adapted and pass
 * tests/solutions.test.js before they ship (CLAUDE.md invariant 11).
 *
 * Usage:
 *   node scripts/import/fetch-solutions.mjs two-sum group-anagrams
 *   node scripts/import/fetch-solutions.mjs --essential
 *   node scripts/import/fetch-solutions.mjs --essential --coverage   (report only, writes nothing)
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE = join(ROOT, 'content', '.cache', 'solutions');
const OUT = join(ROOT, 'content', '.cache', 'imports');

/** Our solution file names, keyed by source file extension. */
const TARGET = {
  py: 'solution.py',
  js: 'solution.js',
  ts: 'solution.ts',
  java: 'Solution.java',
  cpp: 'solution.cpp',
  c: 'solution.c',
  cs: 'Solution.cs',
  go: 'solution.go',
};

const SOURCES = [
  {
    name: 'doocs/leetcode',
    url: 'https://github.com/doocs/leetcode.git',
    license: 'CC BY-SA 4.0',
    dir: 'doocs',
    // solution/0000-0099/0001.Two Sum/Solution.py ; Solution2.py etc. are alternatives
    match: (path) => {
      const m = path.match(/^solution\/[^/]+\/(\d{4})\.[^/]*\/Solution\.(\w+)$/);
      return m && { number: Number(m[1]), ext: m[2] };
    },
  },
  {
    name: 'walkccc/LeetCode',
    url: 'https://github.com/walkccc/LeetCode.git',
    license: 'MIT',
    dir: 'walkccc',
    // solutions/1. Two Sum/1.py ; 1-2.py etc. are alternatives
    match: (path) => {
      const m = path.match(/^solutions\/(\d+)\. [^/]*\/\d+\.(\w+)$/);
      return m && { number: Number(m[1]), ext: m[2] };
    },
  },
];

function git(dir, args, opts = {}) {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', maxBuffer: 1 << 28, ...opts });
}

/**
 * Clones a source without blobs (fast); file contents are fetched on demand by `git show`.
 * @returns {Map<number, Map<string, string>>} problem number -> extension -> repo path
 */
function indexSource(src) {
  const dir = join(CACHE, src.dir);
  if (!existsSync(join(dir, '.git'))) {
    mkdirSync(CACHE, { recursive: true });
    execFileSync('git', ['clone', '-q', '--depth', '1', '--filter=blob:none', '--no-checkout', src.url, dir]);
  }
  const files = new Map();
  for (const path of git(dir, ['ls-tree', '-r', '--name-only', 'HEAD']).split('\n')) {
    const hit = src.match(path);
    if (!hit || !TARGET[hit.ext]) continue;
    if (!files.has(hit.number)) files.set(hit.number, new Map());
    files.get(hit.number).set(hit.ext, path);
  }
  return { dir, files };
}

/** Attribution comment in the file's own syntax. Kept on adapted files (license requirement). */
function header(ext, src, path) {
  const mark = ext === 'py' ? '#' : '//';
  const url = `https://github.com/${src.name}/blob/HEAD/${encodeURI(path)}`;
  return `${mark} Adapted from ${src.name} (${src.license}): ${url}\n`;
}

function loadIndex() {
  const raw = JSON.parse(readFileSync(join(ROOT, 'content', 'index', 'problems.json'), 'utf8'));
  return Array.isArray(raw) ? raw : raw.problems;
}

// typescript is a devDependency, only needed to derive JS. Like the verifier, fall back to a
// global install so the script also runs before `npm install`.
async function loadTypescript() {
  try {
    return (await import('typescript')).default;
  } catch {
    const globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
    return createRequire(join(globalRoot, 'noop.js'))('typescript');
  }
}
const typescript = await loadTypescript();

function main() {
  const args = process.argv.slice(2);
  const coverageOnly = args.includes('--coverage');
  const index = loadIndex();
  let wanted;
  if (args.includes('--essential')) wanted = index.filter((p) => p.essential);
  else wanted = args.filter((a) => !a.startsWith('--')).map((slug) => {
    const p = index.find((x) => x.slug === slug);
    if (!p) throw new Error(`unknown slug: ${slug}`);
    return p;
  });
  if (!wanted.length) {
    console.error('usage: fetch-solutions.mjs [--essential] [--coverage] [slug...]');
    process.exit(2);
  }

  const sources = SOURCES.map((src) => ({ src, ...indexSource(src) }));
  const missing = Object.fromEntries(Object.keys(TARGET).map((e) => [e, 0]));
  let staged = 0;

  for (const p of wanted) {
    if (!p.number || p.platform !== 'leetcode') continue;
    const outDir = join(OUT, p.slug);
    const record = [];
    if (!coverageOnly) {
      // Re-staging starts clean so files from an earlier run never mix with fresh ones.
      rmSync(outDir, { recursive: true, force: true });
      mkdirSync(outDir, { recursive: true });
    }
    for (const ext of Object.keys(TARGET)) {
      // First source that has the language wins, so one problem mostly comes from one source
      // and the algorithms across languages stay the same.
      const found = sources.find((s) => s.files.get(p.number)?.has(ext));
      if (!found) {
        // JavaScript is TypeScript minus the types, so a missing JS file is derived after the loop.
        if (ext === 'js' && sources.some((s) => s.files.get(p.number)?.has('ts'))) continue;
        missing[ext]++;
        continue;
      }
      const path = found.files.get(p.number).get(ext);
      record.push({ file: TARGET[ext], source: found.src.name, license: found.src.license, path });
      if (coverageOnly) continue;
      const body = git(found.dir, ['show', `HEAD:${path}`]);
      writeFileSync(join(outDir, TARGET[ext]), header(ext, found.src, path) + body);
    }
    const ts = record.find((r) => r.file === TARGET.ts);
    if (ts && !record.some((r) => r.file === TARGET.js)) {
      record.push({ ...ts, file: TARGET.js, derived: 'transpiled from solution.ts' });
      if (!coverageOnly) {
        const src = readFileSync(join(outDir, TARGET.ts), 'utf8');
        writeFileSync(join(outDir, TARGET.js), typescript.transpileModule(src, { compilerOptions: { target: typescript.ScriptTarget.ES2022, removeComments: false } }).outputText);
      }
    }
    if (!coverageOnly && record.length) {
      writeFileSync(join(outDir, 'SOURCES.json'), JSON.stringify({ slug: p.slug, number: p.number, title: p.title, files: record }, null, 2) + '\n');
      staged++;
    }
  }

  const n = wanted.length;
  console.log(`${n} problems requested${coverageOnly ? '' : `, ${staged} staged in content/.cache/imports`}`);
  console.log('available per language:', Object.entries(missing).map(([e, m]) => `${e} ${n - m}/${n}`).join(', '));
}

main();
