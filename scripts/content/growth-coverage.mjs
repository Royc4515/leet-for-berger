#!/usr/bin/env node
// Growth coverage report (stage F3, docs/PLAN.md): which problems have no `growth` spec, what our
// target and the best known complexity say, which ADR 0004 target a spec should start from, and
// the input shape, so the remaining work can be split by generator.
//
//   node scripts/content/growth-coverage.mjs              pending problems, grouped by input shape
//   node scripts/content/growth-coverage.mjs --all        also covered and excluded problems
//   node scripts/content/growth-coverage.mjs --markdown   the grouped list as Markdown (for docs/PLAN.md)
//   node scripts/content/growth-coverage.mjs <id> ...     only these problems
//
// Read-only: it never writes problem files. The suggestion is a starting point from the
// statement's "Target complexity" line; the author confirms it with the verifier
// (VERIFY_LANGUAGES=javascript node --test tests/growth-solutions.test.js).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GROWTH_TARGETS } from '../../src/js/engine/growth.js';
import { growthStatus, EXCLUSION_REASONS } from './growth-exclusions.mjs';

const ROOT = new URL('../..', import.meta.url).pathname;

/**
 * The O(...) expressions in a complexity text, without the O and outer parentheses, each with the
 * text that follows it up to the next expression (to spot "per call").
 * @param {string} text e.g. 'O(1) per set, O(log n) per get'
 * @returns {{ expr: string, after: string }[]} e.g. [{ expr: '1', after: ' per set, ' }, ...]
 */
export function bigOs(text) {
  const out = [];
  let at = text.search(/O\(/);
  while (at >= 0) {
    let depth = 0;
    let end = -1;
    for (let i = at + 1; i < text.length; i++) {
      if (text[i] === '(') depth++;
      else if (text[i] === ')' && --depth === 0) {
        end = i;
        break;
      }
    }
    if (end < 0) break;
    const next = text.slice(end + 1).search(/O\(/);
    const stop = next < 0 ? text.length : end + 1 + next;
    out.push({ expr: text.slice(at + 2, end).trim(), after: text.slice(end + 1, stop) });
    at = next < 0 ? -1 : stop;
  }
  return out;
}

// Words in complexity texts that are not sizes.
const NOT_SIZE = new Set(['log', 'min', 'max', 'alpha', 'of', 'the', 'and', 'or', 'with', 'for']);
// Products of two sizes that together count the cells of one grid (n = cells for a grid).
const GRID_PAIRS = [['m', 'n'], ['rows', 'cols'], ['r', 'c']];

/** Splits on '+' outside parentheses: max(m + 1, n) stays one piece. */
function topLevelTerms(expr) {
  const terms = [];
  let depth = 0;
  let cur = '';
  for (const ch of expr) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === '+' && depth === 0) {
      terms.push(cur);
      cur = '';
    } else cur += ch;
  }
  terms.push(cur);
  return terms;
}

/**
 * Polynomial degree of a big-O expression in its sizes, and whether its top term has a log.
 * Terms are separated by '+', factors by '*'; a factor counts once however many words it has
 * ('total length', 'max(m, n)'), raised to its exponent ('n^2'); numbers and log factors count 0.
 * An exponent that is a size (2^n, 3^l, b^(d/2)) or a factorial gives Infinity.
 * @param {string} expr e.g. 'n * k log k', '(V + E) log V', 'rows * cols'
 * @param {{ grid?: boolean }} [opts] grid: the input is a grid, so rows * cols is one size (its cells)
 * @returns {{ degree: number, log: boolean, gridCells: boolean, sizes: string[] }} sizes: the distinct size names of the top term
 */
export function degreeOf(expr, { grid = false } = {}) {
  const e = expr.toLowerCase().replace(/_/g, '').replace(/\|([a-z]+)\|/g, '$1');
  if (/!|\b\d+\s*\^\s*\(?[a-z]|\b[a-z]+\s*\^\s*\(?[a-z]/.test(e)) return { degree: Infinity, log: false, gridCells: false };
  // Distribute a parenthesized sum over what follows: (v + e) log v -> v log v + e log v.
  const flat = e.replace(/^\(([^()]*\+[^()]*)\)\s*(.*)$/, (_, sum, rest) => sum.split('+').map((t) => `${t.trim()} ${rest}`).join(' + '));
  let best = { degree: -1, log: false, gridCells: false, sizes: [] };
  for (const term of topLevelTerms(flat)) {
    const t = term.replace(/log\s*\(?[^)+*]*\)?/g, ' LOG ').replace(/alpha\([^)]*\)/g, ' ');
    const log = /LOG/.test(t);
    let degree = 0;
    const vars = [];
    const factors = [];
    for (const factor of t.split('*')) {
      let fd = 0;
      const words = [];
      for (const m of factor.matchAll(/([a-z][a-z.]*)(?:\s*\^\s*(\d+))?/g)) {
        if (NOT_SIZE.has(m[1])) continue;
        words.push(m[1]);
        fd = Math.max(fd, m[2] ? Number(m[2]) : 1);
      }
      vars.push(...words);
      if (fd) factors.push(words.join(' '));
      degree += fd;
    }
    let gridCells = false;
    if (grid && degree === 2 && GRID_PAIRS.some(([a, b]) => vars.includes(a) && vars.includes(b))) {
      degree = 1;
      gridCells = true;
    }
    if (degree > best.degree || (degree === best.degree && log && !best.log)) best = { degree, log, gridCells, sizes: gridCells ? [] : [...new Set(factors)] };
  }
  return best;
}

/**
 * Suggested ADR 0004 target for a complexity text (the statement's "Target complexity" line or
 * the best known one). The first O(...) decides; for a design problem n counts calls, so a
 * constant or logarithmic cost "per call" becomes n or n log n over a session, and the costliest
 * stated part wins.
 * @param {string|null} text e.g. 'O(n log n) time (O(n^2) times out)'
 * @param {{ grid?: boolean, design?: boolean }} [opts]
 * @returns {{ target: string, bucket: string, note?: string } | null} null when there is no O(...)
 */
export function suggestTarget(text, { grid = false, design = false } = {}) {
  const found = text ? bigOs(text) : [];
  if (!found.length) return null;
  let pick = degreeOf(found[0].expr, { grid });
  if (design) {
    pick = { degree: -1, log: false, gridCells: false, sizes: [] };
    for (const { expr, after } of found) {
      const d = degreeOf(expr, { grid });
      // A cost per call that does not grow with the session adds one factor of n over n calls.
      if (d.degree === 0 && /^\W*(time\s+)?(average\s+|amortized\s+)?(per|amortized|average)\b/i.test(after)) {
        d.degree = 1;
        d.perCall = true;
      }
      if (d.degree > pick.degree || (d.degree === pick.degree && d.log && !pick.log)) pick = d;
    }
  }
  const { degree, log, gridCells, sizes, perCall } = pick;
  if (degree === Infinity) return { target: '2^n', bucket: GROWTH_TARGETS['2^n'] };
  const target = degree <= 0 ? (log ? 'log n' : '1') : degree === 1 ? (log ? 'n log n' : 'n') : degree === 2 ? (log ? 'n^2 log n' : 'n^2') : 'n^3';
  // The note says what n counts when the expression does not say it alone.
  const note = gridCells ? 'n = cells' : perCall ? 'n = calls' : sizes.length > 1 ? `several sizes (${sizes.join(', ')}): grow all of them with n, or fix the bounded ones and lower the target` : null;
  return { target, bucket: GROWTH_TARGETS[target], ...(note ? { note } : {}) };
}

/**
 * Input shape of a problem, for splitting the remaining work by generator (engine/growth-inputs.js).
 * @param {{ kind?: string, signature?: { kind?: string, params?: { name: string, type: string }[] } }} problem
 * @returns {string}
 */
export function inputShape(problem) {
  const sig = problem.signature ?? {};
  if (problem.kind === 'sql' || sig.kind === 'sql') return 'sql';
  if (sig.kind === 'class') return 'design (operation sequence)';
  const params = sig.params ?? [];
  const types = params.map((p) => p.type);
  const named = (re) => params.some((p) => re.test(p.name));
  if (types.some((t) => t.startsWith('TreeNode'))) return 'binary tree';
  if (types.some((t) => /ListNode/.test(t))) return 'linked list';
  if (types.includes('int[][]')) {
    if (named(/edge|prereq|flight|times|relation|graph/i)) return 'graph (edge list)';
    if (named(/grid|matrix|board/i)) return 'grid';
    if (named(/interval|booking|building|points/i)) return 'intervals or pairs';
    return 'list of int lists';
  }
  if (types.includes('string[][]')) return named(/ticket/i) ? 'graph (edge list)' : 'list of string lists';
  if (types.includes('string[]')) return named(/grid|board/i) ? 'grid' : 'list of strings';
  if (types.includes('int[]') || types.includes('long[]')) return 'int array';
  if (types.includes('string')) return 'string';
  return 'numbers (n is a value)';
}

/**
 * One report row per problem.
 * @param {object} problem a problem module's default export
 * @param {{ kind?: string }} entry its catalog entry
 * @param {Record<string, { bestKnown?: { time?: string } | null }>} meta problem-meta.json
 */
export function coverageRow(problem, entry, meta) {
  const ours = (problem.constraints ?? []).find((c) => /Target complexity/i.test(c))?.replace(/^Target complexity:\s*/i, '') ?? null;
  const best = meta[problem.id]?.bestKnown?.time ?? null;
  const shape = inputShape({ kind: entry.kind, signature: problem.signature });
  const opts = { grid: shape === 'grid', design: shape.startsWith('design') };
  // Best known texts come from kamyu104's tables ('O(nlogn)', 'ctor: _O(m * n)_'): only a fallback.
  const suggestion = suggestTarget(ours, opts) ?? suggestTarget(best?.includes('O(') ? best.replace(/nlog/g, 'n log').replace(/<br>/g, ' ') : null, opts);
  return { id: problem.id, kind: entry.kind, shape, ours, best, suggestion, status: growthStatus({ ...problem, kind: entry.kind }), target: problem.growth?.target ?? null };
}

const SHAPE_ORDER = ['int array', 'string', 'list of strings', 'list of string lists', 'list of int lists', 'grid', 'intervals or pairs', 'graph (edge list)', 'binary tree', 'linked list', 'design (operation sequence)', 'numbers (n is a value)', 'sql'];

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const markdown = args.includes('--markdown');
  const only = new Set(args.filter((a) => !a.startsWith('--')));
  const { availableEntries } = await import('../../src/js/problems/index.js');
  const meta = JSON.parse(readFileSync(`${ROOT}src/js/data/problem-meta.json`, 'utf8'));
  const rows = [];
  for (const entry of availableEntries()) {
    if (only.size && !only.has(entry.id)) continue;
    const problem = (await import(`../../src/js/problems/${entry.id}/problem.js`)).default;
    rows.push(coverageRow(problem, entry, meta));
  }
  const count = (s) => rows.filter((r) => r.status.status === s).length;
  const shown = rows.filter((r) => all || only.size || r.status.status === 'pending' || r.status.status === 'missing');
  const groups = new Map();
  for (const r of shown) groups.set(r.shape, [...(groups.get(r.shape) ?? []), r]);
  const shapes = [...groups.keys()].sort((a, b) => SHAPE_ORDER.indexOf(a) - SHAPE_ORDER.indexOf(b));

  if (markdown) {
    for (const shape of shapes) {
      const list = groups.get(shape);
      console.log(`- ${shape[0].toUpperCase()}${shape.slice(1)} (${list.length}): ${list.map((r) => r.id).join(', ')}`);
    }
    return;
  }
  console.log(`Growth coverage: ${count('covered')} covered, ${count('excluded')} excluded, ${count('pending')} pending, ${count('missing')} missing (of ${rows.length})`);
  for (const shape of shapes) {
    console.log(`\n${shape} (${groups.get(shape).length})`);
    for (const r of groups.get(shape)) {
      const s = r.status;
      const state = s.status === 'excluded' ? `excluded: ${s.reason} (${s.why})` : s.status === 'covered' ? `covered: ${r.target}` : s.status;
      const suggest = r.suggestion ? `suggest '${r.suggestion.target}' (${r.suggestion.bucket}${r.suggestion.note ? `, ${r.suggestion.note}` : ''})` : 'no suggestion';
      console.log(`  ${r.id.padEnd(24)} ${state.padEnd(10)}  ours: ${r.ours ?? '-'} | best known: ${r.best ?? '-'} | ${suggest}`);
    }
  }
  if (count('missing')) {
    console.log('\nmissing: add `growth` to these problems, or an entry in scripts/content/growth-exclusions.mjs with one of:');
    for (const [k, v] of Object.entries(EXCLUSION_REASONS)) console.log(`  ${k}: ${v}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
