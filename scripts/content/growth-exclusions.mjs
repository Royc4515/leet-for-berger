// Which problems have no growth estimate, and why (docs/PROBLEM_FORMAT.md "Growth estimate",
// docs/adr/0004-complexity-feedback.md). One place for the whole policy:
//
// - GROWTH_EXCLUSIONS: problems that will never get `growth`, each with a reason category and a
//   one-line why. SQL problems are excluded by kind (KIND_EXCLUSIONS), so a new SQL problem needs
//   no entry.
// - GROWTH_PENDING: algorithm problems that should get `growth` but do not have it yet (stage F3 in
//   docs/PLAN.md). It may only shrink: tests/growth-coverage.test.js fails when a problem is in
//   none of the three states (covered, excluded, pending), when a pending problem already has
//   `growth`, and when the list grows past its ceiling. New problems ship with `growth` or an
//   exclusion, never as pending.
//
// Pure data and one pure function; scripts/content/growth-coverage.mjs reports on it.

/** Reason categories. Each exclusion names one; the text is what the policy says about it. */
export const EXCLUSION_REASONS = {
  sql: 'SQL problem: the query runs in sql.js, and ADR 0004 times functions and classes only.',
  'fixed-size':
    'The input cannot grow: one machine integer (a fixed number of digits or bits), a fixed board, or a fixed state space. There is no n to scale, and one call takes microseconds.',
  'output-bound':
    'The answer lists every combination, so the output is exponential or factorial in n and its size, not the algorithm, decides the time. Any correct solution has the same growth.',
  backtracking:
    'Exponential search on a tiny n, or a backtracking search whose time depends on the contents (letters on a board, word lengths) far more than on the size, so no generator gives a clean power law.',
  sublinear:
    'The target is O(log n): one call takes microseconds at every size a browser can build, under the 1 ms the estimator needs, so every run reads inconclusive.',
};

/** Exclusion by problem kind (catalog `kind`), so new problems of that kind need no entry. */
export const KIND_EXCLUSIONS = { sql: 'sql' };

/** @type {Record<string, { reason: keyof typeof EXCLUSION_REASONS, why: string }>} */
export const GROWTH_EXCLUSIONS = {
  // fixed-size
  'add-without-plus': { reason: 'fixed-size', why: 'two 32-bit integers, at most 32 carry steps' },
  'base-four-check': { reason: 'fixed-size', why: 'one 32-bit integer' },
  'bit-count': { reason: 'fixed-size', why: 'one 32-bit integer, at most 32 steps' },
  'digit-flip': { reason: 'fixed-size', why: 'one 32-bit integer, at most 10 digits' },
  'digit-palindrome': { reason: 'fixed-size', why: 'one 32-bit integer, at most 10 digits' },
  'dotted-quads': { reason: 'fixed-size', why: 'a string of at most 12 digits, at most 3^4 splits' },
  'good-digit-strings': { reason: 'fixed-size', why: 'one 64-bit integer, O(log n) is at most 64 steps' },
  'grammar-symbol': { reason: 'fixed-size', why: 'n <= 30 rows, so at most 30 steps' },
  'lock-steps': { reason: 'fixed-size', why: 'the state space is fixed at 10^4 four-digit codes' },
  'mirror-bits': { reason: 'fixed-size', why: 'one 32-bit integer, 32 steps' },
  'one-swap-max': { reason: 'fixed-size', why: 'one integer of at most 9 digits' },
  'power-mod': { reason: 'fixed-size', why: 'a 64-bit exponent, at most 64 squarings' },
  'stone-take-game': { reason: 'fixed-size', why: 'O(1): the answer is n % 4' },
  'sudoku-check': { reason: 'fixed-size', why: 'always a 9x9 board' },
  'kth-in-order': { reason: 'fixed-size', why: 'values are distinct integers in 0..10^4, so a BST has at most 10001 nodes and one call takes about 0.1 ms' },
  'bst-min-gap': { reason: 'fixed-size', why: 'values are distinct integers in 0..10^5, so a BST has at most 100001 nodes and one call takes about 3 ms, too short for a margin on a faster runner' },
  'zero-by-powers': { reason: 'fixed-size', why: 'one 32-bit integer, O(log n) steps' },
  // output-bound
  'all-orderings': { reason: 'output-bound', why: 'n! orderings of n values' },
  'balanced-pairs': { reason: 'output-bound', why: 'Catalan(n) strings, 58786 at n = 11' },
  'keypad-words': { reason: 'output-bound', why: 'up to 4^n words' },
  'subset-builder': { reason: 'output-bound', why: '2^n subsets' },
  // backtracking
  'board-words': { reason: 'backtracking', why: 'time depends on the letters and the word list, O(cells * 3^length)' },
  'grid-word': { reason: 'backtracking', why: 'time depends on the letters, O(cells * 3^length)' },
  'visit-all-nodes': { reason: 'backtracking', why: 'O(2^n * n^2) with n <= 12; the exponential bucket always matches' },
  // sublinear
  'matrix-search': { reason: 'sublinear', why: 'O(log(m * n)) binary search' },
  'merged-median': { reason: 'sublinear', why: 'O(log(m + n)) binary search' },
  'mountain-peak': { reason: 'sublinear', why: 'O(log n) binary search' },
  'rotated-search': { reason: 'sublinear', why: 'O(log n) binary search' },
  'target-range': { reason: 'sublinear', why: 'O(log n) binary search' },
};

/**
 * Algorithm problems still waiting for `growth` (stage F3). Remove an id when its spec lands.
 * scripts/content/growth-coverage.mjs groups them by input shape for the next batches.
 */
export const GROWTH_PENDING = [
  'account-merge', 'anagram-arrangements', 'anagram-buckets', 'bucket-map', 'caesar-groups',
  'circle-elimination', 'column-sweep', 'cooldown-tasks', 'course-finish-time', 'covering-window',
  'crack-palindrome', 'dictionary-split', 'digit-list-sum', 'dna-repeats', 'fibonacci-mod', 'fizz-buzz-list',
  'gap-in-range', 'glyph-order', 'good-string-count', 'growing-word-chain', 'hill-rearrange',
  'isomorphic-strings', 'jump-reach', 'justify-lines', 'king-path', 'life-step', 'list-loop', 'lone-number',
  'longest-distinct-window', 'no-adjacent-repeat', 'notify-recipients', 'obstacle-clearing', 'overlap-trim',
  'palindrome-joins', 'paren-depth', 'plain-arithmetic', 'point-wiring', 'postfix-eval', 'prefix-score-sum',
  'prefix-tree', 'prime-count', 'random-link-copy', 'range-bookings', 'range-cover', 'ring-shift',
  'roman-numeral-value', 'rotate-grid', 'same-letters', 'shared-prefix', 'skyline-outline',
  'smallest-base-segment', 'spiral-order', 'stair-paths', 'string-gcd', 'string-multiply',
  'subsequence-check', 'suspicious-payments', 'trade-cooldown', 'typeahead-hints', 'unfold-brackets',
  'uphill-path', 'vowel-window', 'widest-palindrome', 'word-morph', 'word-order-flip', 'zero-rows-cols',
];

/**
 * Where a problem stands on growth.
 * @param {{ id: string, kind?: string, growth?: unknown }} problem a catalog entry or a loaded problem
 *   (`growth` is only known on a loaded problem; pass `hasGrowth` for a catalog entry)
 * @param {boolean} [hasGrowth]
 * @returns {{ status: 'covered' } | { status: 'excluded', reason: string, why: string } | { status: 'pending' } | { status: 'missing' }}
 */
export function growthStatus(problem, hasGrowth = problem.growth !== undefined) {
  if (hasGrowth) return { status: 'covered' };
  const byKind = KIND_EXCLUSIONS[problem.kind];
  if (byKind) return { status: 'excluded', reason: byKind, why: `${problem.kind} problem` };
  const ex = GROWTH_EXCLUSIONS[problem.id];
  if (ex) return { status: 'excluded', reason: ex.reason, why: ex.why };
  if (GROWTH_PENDING.includes(problem.id)) return { status: 'pending' };
  return { status: 'missing' };
}
