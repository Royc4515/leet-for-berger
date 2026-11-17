/**
 * Learning network: topics, their prerequisites, and the easy -> hard ladder each topic needs.
 *
 * This is the backbone every content decision hangs off. A problem is placed by
 * (topic, concept, rating), never by a hand-picked "milestone", so the path, topic drills,
 * mock OAs and weak-spot practice can all be derived from the same data.
 *
 * Pure data + pure helpers: no DOM, safe to import from node tests.
 */

/**
 * Difficulty ratings are finer than Easy/Medium/Hard so problems inside one band can still be
 * ordered. The bands are the contract with the UI label.
 */
export const RATING_BANDS = {
  Easy: [1, 3],
  Medium: [4, 7],
  Hard: [8, 10],
};

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   tier: number,
 *   prereqs: string[],
 *   concepts: string[],
 *   ladder: { easy: number, medium: number, hard: number },
 * }} Topic
 */

/**
 * `concepts` are ordered from first-seen to last-seen inside the topic: the ladder walks them
 * in this order, so a learner never meets "monotonic stack" before "matching brackets".
 * `ladder` is the target count of problems per band for that topic.
 * @type {Topic[]}
 */
export const TOPICS = [
  // Tier 0: vocabulary
  {
    id: 'arrays-hashing',
    title: 'Arrays & Hashing',
    tier: 0,
    prereqs: [],
    concepts: ['frequency-count', 'hash-set-membership', 'complement-lookup', 'group-by-key', 'encode-decode'],
    ladder: { easy: 4, medium: 5, hard: 2 },
  },
  {
    id: 'math-basics',
    title: 'Math Basics',
    tier: 0,
    prereqs: [],
    concepts: ['digit-manipulation', 'modular-arithmetic', 'gcd-lcm', 'prime-sieve', 'fast-power'],
    ladder: { easy: 3, medium: 3, hard: 2 },
  },

  // Tier 1: first patterns
  {
    id: 'two-pointers',
    title: 'Two Pointers',
    tier: 1,
    prereqs: ['arrays-hashing'],
    concepts: ['opposite-ends', 'same-direction', 'partition-in-place', 'sort-then-scan'],
    ladder: { easy: 3, medium: 4, hard: 2 },
  },
  {
    id: 'stack',
    title: 'Stack',
    tier: 1,
    prereqs: ['arrays-hashing'],
    concepts: ['matching-brackets', 'simulation', 'auxiliary-stack-design', 'monotonic-stack', 'expression-evaluation'],
    ladder: { easy: 2, medium: 5, hard: 2 },
  },
  {
    id: 'prefix-sum',
    title: 'Prefix Sum',
    tier: 1,
    prereqs: ['arrays-hashing'],
    concepts: ['prefix-1d', 'prefix-plus-hashmap', 'prefix-2d', 'difference-array'],
    ladder: { easy: 2, medium: 4, hard: 2 },
  },
  {
    id: 'sorting-intervals',
    title: 'Sorting & Intervals',
    tier: 1,
    prereqs: ['arrays-hashing'],
    concepts: ['custom-comparator', 'merge-intervals', 'sweep-line', 'counting-bucket-sort'],
    ladder: { easy: 2, medium: 4, hard: 2 },
  },
  {
    id: 'bit-manipulation',
    title: 'Bit Manipulation',
    tier: 1,
    prereqs: ['math-basics'],
    concepts: ['xor-tricks', 'masks-and-shifts', 'counting-bits', 'bitmask-subsets'],
    ladder: { easy: 3, medium: 3, hard: 1 },
  },
  {
    id: 'recursion',
    title: 'Recursion',
    tier: 1,
    prereqs: ['arrays-hashing'],
    concepts: ['base-and-step', 'divide-and-conquer', 'memoization-intro'],
    ladder: { easy: 2, medium: 3, hard: 1 },
  },

  // Tier 2: patterns built on patterns
  {
    id: 'sliding-window',
    title: 'Sliding Window',
    tier: 2,
    prereqs: ['two-pointers'],
    concepts: ['fixed-window', 'variable-window', 'window-frequency-map', 'monotonic-deque'],
    ladder: { easy: 2, medium: 5, hard: 3 },
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    tier: 2,
    prereqs: ['two-pointers'],
    concepts: ['classic-search', 'lower-upper-bound', 'rotated-array', 'search-on-answer', 'search-2d'],
    ladder: { easy: 2, medium: 5, hard: 3 },
  },
  {
    id: 'linked-list',
    title: 'Linked List',
    tier: 2,
    prereqs: ['two-pointers'],
    concepts: ['dummy-node-traversal', 'reversal', 'fast-slow-cycle', 'merge-lists', 'cache-design'],
    ladder: { easy: 3, medium: 4, hard: 2 },
  },
  {
    id: 'greedy',
    title: 'Greedy',
    tier: 2,
    prereqs: ['sorting-intervals'],
    concepts: ['local-choice', 'exchange-argument', 'interval-scheduling', 'reach-extension'],
    ladder: { easy: 2, medium: 5, hard: 3 },
  },

  // Tier 3: core data structures
  {
    id: 'trees',
    title: 'Trees',
    tier: 3,
    prereqs: ['recursion', 'linked-list'],
    concepts: ['dfs-traversal', 'bfs-level-order', 'bst-properties', 'path-problems', 'construct-serialize'],
    ladder: { easy: 3, medium: 6, hard: 3 },
  },
  {
    id: 'backtracking',
    title: 'Backtracking',
    tier: 3,
    prereqs: ['recursion'],
    concepts: ['subsets', 'permutations', 'combinations-with-pruning', 'constraint-search'],
    ladder: { easy: 1, medium: 5, hard: 3 },
  },
  {
    id: 'dp-1d',
    title: '1D Dynamic Programming',
    tier: 3,
    prereqs: ['recursion'],
    concepts: ['linear-recurrence', 'take-or-skip', 'longest-increasing', 'knapsack-1d'],
    ladder: { easy: 2, medium: 6, hard: 2 },
  },
  {
    id: 'strings-advanced',
    title: 'Advanced Strings',
    tier: 3,
    prereqs: ['sliding-window'],
    concepts: ['expand-around-center', 'prefix-function', 'rolling-hash', 'z-function'],
    ladder: { easy: 1, medium: 3, hard: 3 },
  },

  // Tier 4: structures on structures
  {
    id: 'heap',
    title: 'Heap / Priority Queue',
    tier: 4,
    prereqs: ['trees'],
    concepts: ['top-k', 'k-way-merge', 'two-heaps', 'scheduling'],
    ladder: { easy: 1, medium: 4, hard: 3 },
  },
  {
    id: 'tries',
    title: 'Tries',
    tier: 4,
    prereqs: ['trees'],
    concepts: ['insert-search', 'prefix-counting', 'trie-guided-search'],
    ladder: { easy: 1, medium: 2, hard: 2 },
  },
  {
    id: 'graphs',
    title: 'Graphs',
    tier: 4,
    prereqs: ['trees'],
    concepts: ['grid-traversal', 'adjacency-traversal', 'cycle-detection', 'topological-sort', 'bipartite'],
    ladder: { easy: 1, medium: 6, hard: 3 },
  },
  {
    id: 'dp-2d',
    title: '2D Dynamic Programming',
    tier: 4,
    prereqs: ['dp-1d'],
    concepts: ['grid-paths', 'two-sequences', 'knapsack-2d', 'interval-dp', 'state-machine'],
    ladder: { easy: 1, medium: 5, hard: 4 },
  },

  // Tier 5: advanced
  {
    id: 'union-find',
    title: 'Union Find',
    tier: 5,
    prereqs: ['graphs'],
    concepts: ['connectivity', 'union-by-rank', 'offline-queries'],
    ladder: { easy: 0, medium: 3, hard: 2 },
  },
  {
    id: 'advanced-graphs',
    title: 'Advanced Graphs',
    tier: 5,
    prereqs: ['graphs', 'heap'],
    concepts: ['dijkstra', 'bounded-hops-shortest-path', 'minimum-spanning-tree', 'dag-dp', 'zero-one-bfs'],
    ladder: { easy: 0, medium: 4, hard: 4 },
  },
  {
    id: 'range-queries',
    title: 'Range Queries',
    tier: 5,
    prereqs: ['prefix-sum', 'trees'],
    concepts: ['fenwick-tree', 'segment-tree', 'sparse-table'],
    ladder: { easy: 0, medium: 2, hard: 3 },
  },
];

/**
 * Practice modes the content must support. Each lists the problem fields it selects on,
 * so the index schema cannot silently drop something a mode depends on.
 * @type {{ id: string, title: string, selectsOn: string[] }[]}
 */
export const PRACTICE_MODES = [
  { id: 'learning-path', title: 'Learning Path', selectsOn: ['topic', 'concept', 'rating'] },
  { id: 'topic-drill', title: 'Topic Drill', selectsOn: ['topic', 'rating'] },
  { id: 'mixed-review', title: 'Mixed Review', selectsOn: ['topic', 'rating'] },
  { id: 'mock-oa', title: 'Mock OA', selectsOn: ['difficulty', 'estMinutes'] },
  { id: 'interview', title: 'Interview Simulator', selectsOn: ['difficulty', 'estMinutes'] },
  { id: 'company-set', title: 'Company Set', selectsOn: ['companies'] },
  { id: 'daily', title: 'Daily Challenge', selectsOn: ['rating'] },
  { id: 'weak-spots', title: 'Weak Spots', selectsOn: ['topic', 'concept', 'rating'] },
];

/**
 * Structural checks. Returns a list of human-readable errors; empty means valid.
 * @param {Topic[]} topics
 * @returns {string[]}
 */
export function validateTaxonomy(topics) {
  const errors = [];
  const byId = new Map();
  for (const t of topics) {
    if (byId.has(t.id)) errors.push(`duplicate topic id: ${t.id}`);
    byId.set(t.id, t);
  }
  for (const t of topics) {
    for (const p of t.prereqs) {
      const pre = byId.get(p);
      if (!pre) errors.push(`${t.id}: unknown prereq ${p}`);
      // A strictly lower tier makes cycles impossible and keeps the drawn network layered.
      else if (pre.tier >= t.tier) errors.push(`${t.id}: prereq ${p} is not in a lower tier`);
    }
    if (t.tier > 0 && t.prereqs.length === 0) errors.push(`${t.id}: tier ${t.tier} topic needs a prereq`);
    if (t.concepts.length < 3) errors.push(`${t.id}: needs at least 3 concepts`);
    if (new Set(t.concepts).size !== t.concepts.length) errors.push(`${t.id}: duplicate concept`);
    const { easy, medium, hard } = t.ladder;
    if (medium < 2) errors.push(`${t.id}: ladder needs at least 2 medium problems`);
    if (hard < 1) errors.push(`${t.id}: ladder needs at least 1 hard problem`);
    if (easy + medium + hard < 5) errors.push(`${t.id}: ladder needs at least 5 problems`);
  }
  return errors;
}

/**
 * Total target problem count per band, across all topics.
 * @param {Topic[]} topics
 */
export function ladderTotals(topics) {
  const totals = { easy: 0, medium: 0, hard: 0, all: 0 };
  for (const t of topics) {
    totals.easy += t.ladder.easy;
    totals.medium += t.ladder.medium;
    totals.hard += t.ladder.hard;
  }
  totals.all = totals.easy + totals.medium + totals.hard;
  return totals;
}

/**
 * Maps a 1-10 rating to its Easy/Medium/Hard label.
 * @param {number} rating
 * @returns {'Easy'|'Medium'|'Hard'|null}
 */
export function bandOf(rating) {
  for (const [label, [lo, hi]] of Object.entries(RATING_BANDS)) {
    if (rating >= lo && rating <= hi) return /** @type {'Easy'|'Medium'|'Hard'} */ (label);
  }
  return null;
}
