// Growth coverage (stage F3, docs/PLAN.md): every problem has a valid `growth` spec, an exclusion
// with a reason, or a place on the pending list, and the pending list can only shrink. Also the
// pure helpers of scripts/content/growth-coverage.mjs that suggest a target and an input shape.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { availableEntries } from '../src/js/problems/index.js';
import { validateGrowth } from '../src/js/engine/growth.js';
import { EXCLUSION_REASONS, GROWTH_EXCLUSIONS, GROWTH_PENDING, KIND_EXCLUSIONS, growthStatus } from '../scripts/content/growth-exclusions.mjs';
import { bigOs, degreeOf, suggestTarget, inputShape } from '../scripts/content/growth-coverage.mjs';
import { declaresGrowth } from '../scripts/verify/growth.mjs';
import { readFileSync } from 'node:fs';

// don't touch / lower this when problems leave GROWTH_PENDING; never raise it. New problems ship
// with `growth` or an exclusion, so the pending list only shrinks (stage F3).
const PENDING_CEILING = 67;

const entries = availableEntries();
const problems = await Promise.all(entries.map(async (e) => ({ entry: e, problem: (await import(`../src/js/problems/${e.id}/problem.js`)).default })));

test('every problem has growth, an exclusion with a reason, or a pending entry', () => {
  const missing = problems.filter(({ entry, problem }) => growthStatus({ ...problem, kind: entry.kind }).status === 'missing').map(({ entry }) => entry.id);
  assert.deepEqual(missing, [], 'add `growth` (docs/PROBLEM_FORMAT.md) or an exclusion in scripts/content/growth-exclusions.mjs');
});

test('covered problems have a valid spec, and only algorithm problems have one', () => {
  for (const { entry, problem } of problems) {
    if (problem.growth === undefined) continue;
    assert.deepEqual(validateGrowth(problem), [], entry.id);
    assert.ok(!KIND_EXCLUSIONS[entry.kind], `${entry.id}: ${entry.kind} problems are excluded by kind`);
  }
});

test('the growth verifier finds exactly the problems that declare growth', () => {
  // tests/growth-solutions.test.js reads the source instead of importing every module.
  for (const { entry, problem } of problems) {
    const text = readFileSync(new URL(`../src/js/problems/${entry.id}/problem.js`, import.meta.url), 'utf8');
    assert.equal(declaresGrowth(text), problem.growth !== undefined, entry.id);
  }
});

test('exclusions name a known reason and a why, for real problems without growth', () => {
  const byId = new Map(problems.map(({ entry, problem }) => [entry.id, problem]));
  for (const [id, ex] of Object.entries(GROWTH_EXCLUSIONS)) {
    assert.ok(byId.has(id), `${id} is not a published problem`);
    assert.ok(ex.reason in EXCLUSION_REASONS, `${id}: unknown reason "${ex.reason}"`);
    assert.ok(typeof ex.why === 'string' && ex.why.length > 5, `${id}: say why`);
    assert.equal(byId.get(id).growth, undefined, `${id} has growth: remove its exclusion`);
  }
  for (const reason of Object.values(KIND_EXCLUSIONS)) assert.ok(reason in EXCLUSION_REASONS);
  for (const text of Object.values(EXCLUSION_REASONS)) assert.doesNotMatch(text, /\u2014/, 'no em dashes');
});

test('the pending list only holds algorithm problems without growth, and only shrinks', () => {
  const byId = new Map(problems.map((p) => [p.entry.id, p]));
  assert.equal(new Set(GROWTH_PENDING).size, GROWTH_PENDING.length, 'no duplicates');
  for (const id of GROWTH_PENDING) {
    assert.ok(byId.has(id), `${id} is not a published problem`);
    const { entry, problem } = byId.get(id);
    assert.equal(problem.growth, undefined, `${id} has growth now: remove it from GROWTH_PENDING and lower PENDING_CEILING`);
    assert.ok(!(id in GROWTH_EXCLUSIONS), `${id} is both pending and excluded`);
    assert.ok(!KIND_EXCLUSIONS[entry.kind], `${id} is excluded by kind`);
  }
  assert.ok(GROWTH_PENDING.length <= PENDING_CEILING, `the pending list grew to ${GROWTH_PENDING.length} (ceiling ${PENDING_CEILING}): new problems ship with growth or an exclusion`);
});

test('growthStatus: covered wins, then kind, then the exclusion list, then pending', () => {
  assert.deepEqual(growthStatus({ id: 'x', growth: {} }), { status: 'covered' });
  assert.equal(growthStatus({ id: 'x', kind: 'sql' }).reason, 'sql');
  assert.equal(growthStatus({ id: 'bit-count', kind: 'function' }).reason, 'fixed-size');
  assert.equal(growthStatus({ id: GROWTH_PENDING[0], kind: 'function' }).status, 'pending');
  assert.equal(growthStatus({ id: 'not-a-problem', kind: 'function' }).status, 'missing');
  assert.equal(growthStatus({ id: 'x' }, true).status, 'covered');
});

test('bigOs finds each O(...) with what follows it', () => {
  assert.deepEqual(bigOs('O(n log n) time (O(n^2) times out)').map((b) => b.expr), ['n log n', 'n^2']);
  assert.deepEqual(bigOs('O(1) per set, O(log n) per get'), [
    { expr: '1', after: ' per set, ' },
    { expr: 'log n', after: ' per get' },
  ]);
  assert.deepEqual(bigOs('O((V + E) log V) time').map((b) => b.expr), ['(V + E) log V']);
  assert.deepEqual(bigOs('no big O here'), []);
});

test('degreeOf counts size factors, not words, constants or logs', () => {
  const d = (e, o) => {
    const r = degreeOf(e, o);
    return [r.degree, r.log];
  };
  assert.deepEqual(d('n'), [1, false]);
  assert.deepEqual(d('n log n'), [1, true]);
  assert.deepEqual(d('m + n'), [1, false]);
  assert.deepEqual(d('n + 101'), [1, false]);
  assert.deepEqual(d('26 * n'), [1, false]);
  assert.deepEqual(d('total length'), [1, false]);
  assert.deepEqual(d('max(m, n)'), [1, false]);
  assert.deepEqual(d('n alpha(n)'), [1, false]);
  assert.deepEqual(d('|s| + |t|'), [1, false]);
  assert.deepEqual(d('(V + E) log V'), [1, true]);
  assert.deepEqual(d('n log(max pile)'), [1, true]);
  assert.deepEqual(d('n^2'), [2, false]);
  assert.deepEqual(d('m * n'), [2, false]);
  assert.deepEqual(d('n * k log k'), [2, true]);
  assert.deepEqual(d('n^3'), [3, false]);
  assert.deepEqual(d('1'), [0, false]);
  assert.deepEqual(d('log10 x'), [0, true]);
  assert.deepEqual(d('C + 26^2'), [1, false]);
  assert.equal(degreeOf('2^n * n^2').degree, Infinity);
  assert.equal(degreeOf('n! * n').degree, Infinity);
  assert.equal(degreeOf('b^(d/2)').degree, Infinity);
  // A grid's rows * cols is its cell count.
  assert.deepEqual(degreeOf('rows * cols', { grid: true }), { degree: 1, log: false, gridCells: true, sizes: [] });
  assert.deepEqual(degreeOf('m * n').sizes, ['m', 'n']);
});

test('suggestTarget maps a complexity text to an ADR 0004 target', () => {
  const t = (text, opts) => suggestTarget(text, opts)?.target ?? null;
  assert.equal(t('O(n) time'), 'n');
  assert.equal(t('O(n log n) (O(n^2) times out)'), 'n log n');
  assert.equal(t('O(n^2) time (O(n) is possible); O(n^3) times out'), 'n^2');
  assert.equal(t('O(n^3) time, O(n^2) space'), 'n^3');
  assert.equal(t('O(log n) time'), 'log n');
  assert.equal(t('O(1) time and space'), '1');
  assert.equal(t('O(2^n * n^2) (trying every order of the nodes, 12!, times out)'), '2^n');
  assert.equal(t('Target unknown'), null);
  assert.equal(t(null), null);
  const grid = suggestTarget('O(rows * cols) time', { grid: true });
  assert.deepEqual(grid, { target: 'n', bucket: 'linear', note: 'n = cells' });
  // Designs: n counts calls, so a constant or log cost per call grows by one factor of n.
  assert.deepEqual(suggestTarget('O(1) average per call', { design: true }), { target: 'n', bucket: 'linear', note: 'n = calls' });
  assert.equal(t('O(1) per set, O(log n) per get', { design: true }), 'n log n');
  assert.equal(t('O(log n) per call, or O(1) amortized', { design: true }), 'n log n');
  assert.equal(t('O(n) time per call for a tree of n nodes', { design: true }), 'n');
  // Several sizes: the note says so, because n has to be chosen.
  assert.match(suggestTarget('O(amount * coins.length) time').note, /several sizes \(amount, coins.length\)/);
});

test('inputShape groups problems by the generator they need', () => {
  const sig = (...params) => ({ signature: { params: params.map(([name, type]) => ({ name, type })) } });
  assert.equal(inputShape({ kind: 'sql' }), 'sql');
  assert.equal(inputShape({ signature: { kind: 'class' } }), 'design (operation sequence)');
  assert.equal(inputShape(sig(['nums', 'int[]'], ['k', 'int'])), 'int array');
  assert.equal(inputShape(sig(['s', 'string'])), 'string');
  assert.equal(inputShape(sig(['words', 'string[]'])), 'list of strings');
  assert.equal(inputShape(sig(['grid', 'string[]'])), 'grid');
  assert.equal(inputShape(sig(['matrix', 'int[][]'])), 'grid');
  assert.equal(inputShape(sig(['intervals', 'int[][]'])), 'intervals or pairs');
  assert.equal(inputShape(sig(['n', 'int'], ['edges', 'int[][]'])), 'graph (edge list)');
  assert.equal(inputShape(sig(['tickets', 'string[][]'])), 'graph (edge list)');
  assert.equal(inputShape(sig(['accounts', 'string[][]'])), 'list of string lists');
  assert.equal(inputShape(sig(['nums', 'int[][]'])), 'list of int lists');
  assert.equal(inputShape(sig(['root', 'TreeNode'])), 'binary tree');
  assert.equal(inputShape(sig(['head', 'ListNode@cycle'])), 'linked list');
  assert.equal(inputShape(sig(['n', 'int'])), 'numbers (n is a value)');
});
