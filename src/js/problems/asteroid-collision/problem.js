/**
 * Problem: Asteroid Collision
 *
 * Simulate a row of asteroids drifting left or right and report what survives. Only a
 * left-moving asteroid can hit something, and what it hits first is the nearest right-mover
 * still standing before it: the top of a stack of survivors. Each asteroid is pushed and popped
 * at most once, so the whole simulation is O(n).
 */

import { mulberry32 } from '../../engine/rng.js';
import { randInt } from '../../engine/growth-inputs.js';

/**
 * Reference: a stack of survivors; each left-mover fights the right-movers on top of it.
 * @param {number[]} asteroids
 * @returns {number[]}
 */
export function reference(asteroids) {
  const stack = [];
  for (const a of asteroids) {
    let alive = true;
    while (alive && a < 0 && stack.length && stack[stack.length - 1] > 0) {
      const top = stack[stack.length - 1];
      if (top < -a) stack.pop();
      else {
        if (top === -a) stack.pop();
        alive = false;
      }
    }
    if (alive) stack.push(a);
  }
  return stack;
}

const MAX_N = 100000;
const MAX_SIZE = 1000;

/** Seeded non-zero asteroids with sizes in [1, maxSize]; `rightRate` is the share moving right. */
function randomAsteroids(seed, n, maxSize, rightRate) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => {
    const size = 1 + Math.floor(rnd() * maxSize);
    return rnd() < rightRate ? size : -size;
  });
}

const visible = [
  { args: [[4, 9, -4]], expected: [4, 9], note: 'The 9 and the -4 meet; the 9 is larger, so only the -4 is destroyed.' },
  { args: [[6, -6]], expected: [], note: 'Equal sizes destroy each other.' },
  { args: [[10, 3, -7]], expected: [10], note: 'The -7 destroys the 3, then meets the 10 and is destroyed.' },
  { args: [[-3, -1, 2, 5]], expected: [-3, -1, 2, 5], note: 'Left-movers on the left and right-movers on the right never meet.' },
  { args: [[1, -2, -2, -2]], expected: [-2, -2, -2], note: 'After the first collision nothing is left moving right.' },
];

// Hidden tests: mutual destruction followed by a survivor, a chain that one asteroid wipes out,
// a left-mover that loses after several wins, and 10^5 asteroids where repeating "find the
// next collision" passes is quadratic.
const hiddenArgs = [
  [[1, -1, -2]],
  [[2, -1, -2]],
  [[1, 2, 3, -10]],
  [[10, -1, -2, -3, -11]],
  [[-5, 5]],
  [randomAsteroids(7, 1000, 20, 0.5)],
  [[...new Array(MAX_N - 1).fill(1), -MAX_SIZE]],
  [randomAsteroids(11, MAX_N, MAX_SIZE, 0.5)],
  [[...Array.from({ length: MAX_N / 2 }, (_, i) => 1 + (i % MAX_SIZE)), ...Array.from({ length: MAX_N / 2 }, (_, i) => -(1 + (i % 500)))]],
  [randomAsteroids(13, MAX_N, MAX_SIZE, 0.7)],
];

export const problem = {
  id: 'asteroid-collision',
  title: 'Asteroid Collision',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Stack', 'Simulation'],
  timeLimitMs: 2000,
  argNames: ['asteroids'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Asteroids sit in a row, listed from left to right in <code>asteroids</code>. The absolute
    value of each entry is its size and the sign is its direction: positive moves right,
    negative moves left. All asteroids move at the same speed.</p>
    <p>When two asteroids meet, the smaller one is destroyed; if they have the same size, both
    are destroyed. Two asteroids moving in the same direction never meet.</p>
    <p>Return the asteroids that are left once no more collisions can happen, in their left to
    right order.</p>
  `,
  constraints: [
    '2 <= asteroids.length <= 10^5',
    '-1000 <= asteroids[i] <= 1000',
    'asteroids[i] != 0',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `asteroids = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which pairs of directions can actually meet? Does a left-mover ever meet something on its right?',
    'When a left-moving asteroid arrives, which surviving asteroid does it reach first?',
    'What structure gives you the most recent survivor quickly and lets you remove it?',
    'A left-mover may win several fights in a row. When does it stop, and does it get added afterwards?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Build the survivors left to right on a stack. A new asteroid can only collide if it moves left
    and the top of the stack moves right. It then destroys smaller right-movers one at a time, until it
    is destroyed, ties, or no right-mover is left on top.</p>
    <h4>Why it works</h4>
    <p>Asteroids moving apart or in the same direction never meet, so every collision is a right-mover
    on the left against a left-mover on the right. The first one a left-mover reaches is the nearest
    surviving right-mover, which is the top of the stack. A left-mover that survives every fight has
    only left-movers or nothing below it, so it is pushed and never collides again.</p>
    <h4>Complexity</h4>
    <p>O(n) time: every asteroid is pushed once and popped at most once, so the inner loop is amortized
    across the whole scan. O(n) space for the stack.</p>
    <h4>Pitfall</h4>
    <p>Equal sizes destroy both asteroids: pop the right-mover and do not push the left-mover. Also
    check the directions exactly. A left-mover on top with a right-mover arriving (<code>top &lt;
    0</code>, <code>a &gt; 0</code>) is a pair moving apart, not a collision.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'asteroidCollision',
    params: [{ name: 'asteroids', type: 'int[]' }],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: asteroids as a JSON array.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let asteroids;
    try {
      asteroids = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter asteroids as a JSON array, for example [5,10,-5].' };
    }
    if (!Array.isArray(asteroids) || asteroids.length < 2 || asteroids.length > MAX_N) return { ok: false, error: 'asteroids must have 2 to 10^5 elements.' };
    if (!asteroids.every((v) => Number.isInteger(v) && v !== 0 && Math.abs(v) <= MAX_SIZE)) return { ok: false, error: 'Each asteroid must be a non-zero integer within +-1000.' };
    return { ok: true, args: [asteroids] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Random sizes and directions: collisions happen all along the stack, and every asteroid is pushed and popped at most once, so the pass stays linear.
  growth: {
    target: 'n',
    n: 'asteroids.length',
    sizes: [32000, 64000, 128000, 256000, 512000, 1024000, 2048000, 4096000],
    input: (n, seed) => {
      const rng = mulberry32(seed);
      return [Array.from({ length: n }, () => (rng() < 0.5 ? -1 : 1) * randInt(rng, 1, 1000))];
    },
  },
};

export default problem;
