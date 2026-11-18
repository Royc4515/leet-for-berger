/**
 * Problem: One Swap Max
 *
 * Swap at most one pair of digits to make the number as large as possible. Greedy: the leftmost
 * digit that has a strictly larger digit somewhere to its right should be swapped with the largest
 * such digit, and among equal largest digits with the LAST one (swapping 1993 -> 9913, not 9193).
 * The input is tiny (at most 9 digits), so the traps are correctness, not speed: ties, digits
 * already in descending order, zeros, and the single-digit case.
 */

const MAX_NUM = 100000000;

/**
 * Reference: suffix maximum (rightmost on ties), then swap at the first improvable position.
 * @param {number} num
 * @returns {number}
 */
export function reference(num) {
  const d = String(num).split('');
  const n = d.length;
  const best = Array(n);
  best[n - 1] = n - 1;
  for (let i = n - 2; i >= 0; i--) best[i] = d[i] > d[best[i + 1]] ? i : best[i + 1];
  for (let i = 0; i < n; i++) {
    if (d[best[i]] > d[i]) {
      [d[i], d[best[i]]] = [d[best[i]], d[i]];
      break;
    }
  }
  return Number(d.join(''));
}

const visible = [
  { args: [2736], expected: 7236, note: 'Swap the 2 and the 7.' },
  { args: [9973], expected: 9973, note: 'The digits are already in descending order; no swap helps.' },
  { args: [1993], expected: 9913, note: 'Swap the 1 with the last 9, not the first one.' },
  { args: [0], expected: 0, note: 'A single digit cannot be swapped with anything.' },
  { args: [98368], expected: 98863, note: 'The first digit that can grow is the 3 at index 2; the 8 at the end is the largest digit after it.' },
];

// Hidden tests: single digits, trailing and inner zeros, the upper bound, ties far apart, a
// number that only improves at its last pair, and long runs of repeated digits.
const hiddenArgs = [[9], [10], [1001], [MAX_NUM], [99999999], [12345678], [87654312], [109090], [11112], [98765432]];

export const problem = {
  id: 'one-swap-max',
  title: 'One Swap Max',
  difficulty: 'Medium',
  topics: ['greedy'],
  patterns: ['Greedy', 'Digits'],
  timeLimitMs: 1000,
  argNames: ['num'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a non-negative integer <code>num</code>. You may pick two digits of its decimal
    form and swap them, <strong>at most once</strong> (you may also do nothing).</p>
    <p>Return the largest number you can get this way.</p>
  `,
  constraints: ['0 <= num <= 10^8', 'Target complexity: O(d) time for d digits'],
  examples: visible.slice(0, 3).map((t) => ({
    input: `num = ${t.args[0]}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which position matters most for the size of a number? Which digit would you most like to change?',
    'When is it impossible to improve the number at all?',
    'Once you know which position to improve, which digit should move there, and from where?',
    'If the best digit to bring forward appears several times, does it matter which copy you take? Try 1993.',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Find the leftmost digit that has a strictly larger digit somewhere to its right, and swap it
    with the largest digit to its right. Precompute, for each position, where the largest digit
    of the suffix sits, taking the rightmost copy on ties.</p>
    <h4>Why it works</h4>
    <p>The leftmost position you can raise matters more than every position after it, so improve
    that one and raise it as high as possible. The digit sent back lands on a later position, and
    sending it to the rightmost possible place puts the smaller digit where it hurts least. If no
    digit has a larger one after it, the digits are non-increasing and no swap helps.</p>
    <h4>Complexity</h4>
    <p>O(d) time and space for d digits, at most 9 here: one right-to-left pass for the suffix
    maxima and one left-to-right pass to find the swap. Trying all pairs is O(d^2), fine too, but
    the greedy is the point.</p>
    <h4>Pitfall</h4>
    <p>Ties. With <code>1993</code> the 1 must swap with the last 9, giving <code>9913</code>;
    picking the first 9 gives <code>9193</code>. Keep the later index when digits are equal.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'maximumSwap',
    params: [{ name: 'num', type: 'int' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: num as a single integer.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const text = raw.trim();
    if (!/^\d+$/.test(text)) return { ok: false, error: 'Enter num as a non-negative integer, for example 2736.' };
    const num = Number(text);
    if (num > MAX_NUM) return { ok: false, error: 'num must be from 0 to 10^8.' };
    return { ok: true, args: [num] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
