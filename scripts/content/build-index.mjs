// Builds content/index/problems.json from the datasets in content/.cache.
// Usage: bash scripts/content/fetch-sources.sh && node scripts/content/build-index.mjs
//
// The index holds facts and links only (title, difficulty, tags, company signals). Problem
// statements and tests are written separately in src/js/problems/.
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { TOPICS, validateIndexRecord } from '../../src/js/data/taxonomy.js';
import { validateFamilies, pickVersion } from '../../src/js/data/families.js';

const ROOT = new URL('../../', import.meta.url).pathname;
const CACHE = join(ROOT, 'content/.cache');
const OUT = join(ROOT, 'content/index/problems.json');

/** Most specific first: the first rule whose tags all appear on a problem decides its topic. */
const TAG_RULES = [
  [['Database'], 'sql', null],
  [['Concurrency'], 'design', null],
  [["Dijkstra's Algorithm"], 'advanced-graphs', 'dijkstra'],
  [['0-1 BFS'], 'advanced-graphs', 'zero-one-bfs'],
  [['Bellman–Ford Algorithm'], 'advanced-graphs', 'bounded-hops-shortest-path'],
  [['Minimum Spanning Tree'], 'advanced-graphs', 'minimum-spanning-tree'],
  [["Kruskal's Algorithm"], 'advanced-graphs', 'minimum-spanning-tree'],
  [["Prim's Algorithm"], 'advanced-graphs', 'minimum-spanning-tree'],
  [['Shortest Path'], 'advanced-graphs', 'dijkstra'],
  [['Flow Network'], 'advanced-graphs', null],
  [['Segment Tree'], 'range-queries', 'segment-tree'],
  [['Binary Indexed Tree'], 'range-queries', 'fenwick-tree'],
  [['Range Minimum/Maximum Query'], 'range-queries', null],
  [['Sparse Table'], 'range-queries', null],
  [['Union-Find'], 'union-find', 'connectivity'],
  [['Trie'], 'tries', null],
  [['Knuth–Morris–Pratt Algorithm'], 'strings-advanced', 'prefix-function'],
  [['Z Algorithm'], 'strings-advanced', 'z-function'],
  [['Rolling Hash'], 'strings-advanced', 'rolling-hash'],
  [['Manacher'], 'strings-advanced', 'expand-around-center'],
  [['String Matching'], 'strings-advanced', 'prefix-function'],
  [['Topological Sort'], 'graphs', 'topological-sort'],
  [['Bipartite Graph'], 'graphs', 'bipartite'],
  [['Directed Acyclic Graph'], 'advanced-graphs', 'dag-dp'],
  [['Monotonic Queue'], 'sliding-window', 'monotonic-deque'],
  [['Monotonic Stack'], 'stack', 'monotonic-stack'],
  [['Bitmask'], 'bit-manipulation', 'bitmask-subsets'],
  [['Backtracking'], 'backtracking', null],
  [['Heap (Priority Queue)'], 'heap', null],
  [['Quickselect'], 'heap', 'top-k'],
  [['Iterator'], 'design', 'iterator-design'],
  [['Data Stream'], 'design', 'data-stream'],
  [['Design'], 'design', null],
  [['Longest Increasing Subsequence'], 'dp-1d', 'longest-increasing'],
  [['Longest Common Subsequence'], 'dp-2d', 'two-sequences'],
  [['0-1 Knapsack'], 'dp-1d', 'knapsack-1d'],
  [['Complete Knapsack'], 'dp-1d', 'knapsack-1d'],
  [['Knapsack Problem'], 'dp-1d', 'knapsack-1d'],
  [['Dynamic Programming', 'Matrix'], 'dp-2d', 'grid-paths'],
  [['Dynamic Programming'], 'dp-1d', null],
  [['Sliding Window'], 'sliding-window', null],
  [["Floyd's Cycle Finding Algorithm"], 'linked-list', 'fast-slow-cycle'],
  [['Linked List'], 'linked-list', null],
  [['Doubly-Linked List'], 'linked-list', null],
  [['Binary Search Tree'], 'trees', 'bst-properties'],
  [['Lowest Common Ancestor'], 'trees', 'path-problems'],
  [['Binary Tree'], 'trees', null],
  [['Tree'], 'trees', null],
  [['Graph Theory'], 'graphs', null],
  [['Breadth-First Search', 'Matrix'], 'graphs', 'grid-traversal'],
  [['Depth-First Search', 'Matrix'], 'graphs', 'grid-traversal'],
  [['Breadth-First Search'], 'graphs', null],
  [['Depth-First Search'], 'graphs', null],
  [['Binary Search'], 'binary-search', null],
  [['Prefix Sum'], 'prefix-sum', null],
  [['Sweep Line'], 'sorting-intervals', 'sweep-line'],
  [['Two Pointers'], 'two-pointers', null],
  [['Bracket Sequences'], 'stack', 'matching-brackets'],
  [['Stack'], 'stack', null],
  [['Greedy'], 'greedy', null],
  [['Bit Manipulation'], 'bit-manipulation', null],
  [['Recursion'], 'recursion', null],
  [['Divide and Conquer'], 'recursion', 'divide-and-conquer'],
  [['Memoization'], 'recursion', 'memoization-intro'],
  [['Counting Sort'], 'sorting-intervals', 'counting-bucket-sort'],
  [['Bucket Sort'], 'sorting-intervals', 'counting-bucket-sort'],
  [['Sorting'], 'sorting-intervals', null],
  [['Matrix', 'Simulation'], 'matrix', 'grid-simulation'],
  [['Matrix'], 'matrix', null],
  [['Greatest Common Divisor'], 'math-basics', 'gcd-lcm'],
  [['Sieve Theory'], 'math-basics', 'prime-sieve'],
  [['Geometry'], 'math-basics', 'geometry'],
  [['Combinatorics'], 'math-basics', 'combinatorics'],
  [['Game Theory'], 'math-basics', 'game-theory'],
  [['Number Theory'], 'math-basics', null],
  [['Math'], 'math-basics', null],
  [['Counting'], 'arrays-hashing', 'frequency-count'],
  [['Hash Table'], 'arrays-hashing', null],
];

const NEETCODE_PATTERNS = {
  'Arrays & Hashing': 'arrays-hashing',
  'Two Pointers': 'two-pointers',
  'Sliding Window': 'sliding-window',
  Stack: 'stack',
  'Binary Search': 'binary-search',
  'Linked List': 'linked-list',
  Trees: 'trees',
  Tries: 'tries',
  'Heap / Priority Queue': 'heap',
  Backtracking: 'backtracking',
  Graphs: 'graphs',
  'Advanced Graphs': 'advanced-graphs',
  '1-D Dynamic Programming': 'dp-1d',
  '2-D Dynamic Programming': 'dp-2d',
  Greedy: 'greedy',
  Intervals: 'sorting-intervals',
  'Math & Geometry': 'math-basics',
  'Bit Manipulation': 'bit-manipulation',
};

/**
 * Problems already authored or planned in the app, keyed by LeetCode slug. Status here only
 * records authoring progress; ladder membership (content/ladders.json) is what makes a
 * problem `selected`.
 */
const CONTENT_IDS = {
  'repeated-substring-pattern': ['smallest-base-segment', 'verified'],
  'notify-recipients': ['notify-recipients', 'verified'],
  'reverse-linked-list': ['reverse-list', 'verified'],
  'binary-tree-level-order-traversal': ['level-order', 'verified'],
  'min-stack': ['min-stack', 'verified'],
  'top-k-frequent-elements': ['top-k-frequent', 'verified'],
  'longest-consecutive-sequence': ['longest-streak', 'verified'],
  'isomorphic-strings': ['isomorphic-strings', 'verified'],
  'time-needed-to-buy-tickets': ['ticket-queue', 'verified'],
  'two-sum': ['pair-sum-target', 'verified'],
  'group-anagrams': ['anagram-buckets', 'verified'],
  'palindrome-number': ['digit-palindrome', 'verified'],
  'roman-to-integer': ['roman-numeral-value', 'verified'],
  'multiply-strings': ['string-multiply', 'verified'],
  'count-primes': ['prime-count', 'verified'],
  'greatest-common-divisor-of-strings': ['string-gcd', 'verified'],
  // Integer variant: modular result instead of a double, so judging is exact.
  'powx-n': ['power-mod', 'verified'],
  'spiral-matrix': ['spiral-order', 'verified'],
  'rotate-image': ['rotate-grid', 'verified'],
  'set-matrix-zeroes': ['zero-rows-cols', 'verified'],
  'single-number': ['lone-number', 'verified'],
  'number-of-1-bits': ['bit-count', 'verified'],
  'sum-of-two-integers': ['add-without-plus', 'verified'],
  'find-the-winner-of-the-circular-game': ['circle-elimination', 'verified'],
  'k-th-symbol-in-grammar': ['grammar-symbol', 'verified'],
  'trapping-rain-water': ['rain-trap', 'verified'],
  'merge-sorted-array': ['merge-sorted', 'verified'],
  'move-zeroes': ['zeros-to-end', 'verified'],
  '3sum': ['zero-triplets', 'verified'],
  'valid-parentheses': ['bracket-check', 'verified'],
  'asteroid-collision': ['asteroid-collision', 'verified'],
  'daily-temperatures': ['warmer-days', 'verified'],
  'evaluate-reverse-polish-notation': ['postfix-eval', 'verified'],
  'product-of-array-except-self': ['product-except-self', 'verified'],
  'subarray-sum-equals-k': ['subarray-sum-k', 'verified'],
  'range-sum-query-2d-immutable': ['region-sum', 'verified'],
  'corporate-flight-bookings': ['range-bookings', 'verified'],
  'largest-number': ['largest-concat', 'verified'],
  'merge-intervals': ['merge-ranges', 'verified'],
  'how-many-numbers-are-smaller-than-the-current-number': ['smaller-count', 'verified'],
  'sliding-window-maximum': ['window-maximums', 'verified'],
  'minimum-window-substring': ['covering-window', 'verified'],
  'maximum-number-of-vowels-in-a-substring-of-given-length': ['vowel-window', 'verified'],
  'koko-eating-bananas': ['eating-speed', 'verified'],
  'median-of-two-sorted-arrays': ['merged-median', 'verified'],
  'search-a-2d-matrix': ['matrix-search', 'verified'],
  'find-first-and-last-position-of-element-in-sorted-array': ['target-range', 'verified'],
  'find-peak-element': ['mountain-peak', 'verified'],
  'find-median-from-data-stream': ['median-stream', 'verified'],
  'kth-largest-element-in-an-array': ['kth-highest', 'verified'],
  'task-scheduler': ['cooldown-tasks', 'verified'],
  'reorganize-string': ['no-adjacent-repeat', 'verified'],
  'smallest-range-covering-elements-from-k-lists': ['range-cover', 'verified'],
  'word-search': ['grid-word', 'verified'],
  'letter-combinations-of-a-phone-number': ['keypad-words', 'verified'],
  permutations: ['all-orderings', 'verified'],
  'maximum-subarray': ['best-run-sum', 'verified'],
  'non-overlapping-intervals': ['overlap-trim', 'verified'],
  'assign-cookies': ['cookie-match', 'verified'],
  'maximum-swap': ['one-swap-max', 'verified'],
  'coin-change': ['fewest-coins', 'verified'],
  'house-robber': ['street-heist', 'verified'],
  'longest-increasing-subsequence': ['rising-chain', 'verified'],
  'maximum-product-subarray': ['best-run-product', 'verified'],
  'count-ways-to-build-good-strings': ['good-string-count', 'verified'],
  'valid-palindrome': ['mirror-check', null],
  'longest-substring-without-repeating-characters': ['longest-distinct-window', 'verified'],
  'meeting-rooms-ii': ['meeting-room-minimizer', 'verified'],
  'search-in-rotated-sorted-array': ['rotated-search', 'verified'],
  'jump-game': ['jump-reach', 'verified'],
  'maximum-level-sum-of-a-binary-tree': ['tree-level-sums', null],
  'lowest-common-ancestor-of-a-binary-tree': ['lowest-shared-ancestor', null],
  'number-of-islands': ['island-count', 'verified'],
  'k-closest-points-to-origin': ['k-closest-points', null],
  subsets: ['subset-builder', 'verified'],
  'climbing-stairs': ['stair-paths', 'verified'],
  'edit-distance': ['edit-steps', 'verified'],
  'minimum-path-sum': ['grid-min-path', null],
  'cheapest-flights-within-k-stops': ['cheapest-route-k-stops', 'verified'],
  'course-schedule': ['course-check', 'verified'],
  'course-schedule-ii': ['course-order', 'verified'],
  'word-ladder': ['word-morph', 'verified'],
  'open-the-lock': ['lock-steps', 'verified'],
  'is-graph-bipartite': ['two-color-check', 'verified'],
  'redundant-connection': ['extra-link', 'verified'],
  'accounts-merge': ['account-merge', 'verified'],
  'checking-existence-of-edge-length-limited-paths': ['limited-paths', 'verified'],
  // SQL problems: one verified solution.sql each (docs/adr/0003-sql-problems.md).
  'recyclable-and-low-fat-products': ['green-products', 'verified'],
  'combine-two-tables': ['address-lookup', 'verified'],
  'duplicate-emails': ['repeated-emails', 'verified'],
  'second-highest-salary': ['runner-up-salary', 'verified'],
  'consecutive-numbers': ['triple-repeat', 'verified'],
  'binary-tree-maximum-path-sum': ['best-tree-path', 'verified'],
  // Exact format variant: pre-order with '#' for missing children, so each direction is judged.
  'serialize-and-deserialize-binary-tree': ['tree-codec', 'verified'],
  'maximum-depth-of-binary-tree': ['tree-height', 'verified'],
  'kth-smallest-element-in-a-bst': ['kth-in-order', 'verified'],
  'house-robber-iii': ['tree-heist', 'verified'],
  'longest-increasing-path-in-a-matrix': ['uphill-path', 'verified'],
  'burst-balloons': ['balloon-pop', 'verified'],
  // Count modulo 10^9 + 7, so intermediate counts cannot overflow silently.
  'coin-change-ii': ['coin-combos', 'verified'],
  'best-time-to-buy-and-sell-stock-with-cooldown': ['trade-cooldown', 'verified'],
  'lru-cache': ['recent-cache', 'verified'],
  'merge-k-sorted-lists': ['merge-many-lists', 'verified'],
  'add-two-numbers': ['digit-list-sum', 'verified'],
  'rotate-list': ['shift-list', 'verified'],
  'time-based-key-value-store': ['versioned-store', 'verified'],
  'lfu-cache': ['frequent-cache', 'verified'],
  // Keys up to 10^9 so the map must hash; built-in maps are forbidden on trust, not checked.
  'design-hashmap': ['bucket-map', 'verified'],
  'design-hit-counter': ['hit-window', 'verified'],
  'implement-trie-prefix-tree': ['prefix-tree', 'verified'],
  // Output fixed to lexicographic order so the answer is unique.
  'word-search-ii': ['board-words', 'verified'],
  'longest-common-prefix': ['shared-prefix', 'verified'],
  'linked-list-cycle': ['list-loop', 'verified'],
  'copy-list-with-random-pointer': ['random-link-copy', 'verified'],
  'flatten-nested-list-iterator': ['nested-flatten', 'verified'],
  'insert-delete-getrandom-o1': ['random-pool', 'verified'],
  'reconstruct-itinerary': ['ticket-itinerary', 'verified'],
  'network-delay-time': ['signal-spread', 'verified'],
  'min-cost-to-connect-all-points': ['point-wiring', 'verified'],
  'parallel-courses-iii': ['course-finish-time', 'verified'],
  'minimum-obstacle-removal-to-reach-corner': ['obstacle-clearing', 'verified'],
  'reverse-pairs': ['double-inversions', 'verified'],
  'the-skyline-problem': ['skyline-outline', 'verified'],
  'shortest-path-visiting-all-nodes': ['visit-all-nodes', 'verified'],
  'longest-palindromic-substring': ['widest-palindrome', 'verified'],
  'find-the-index-of-the-first-occurrence-in-a-string': ['first-match-index', 'verified'],
  'repeated-dna-sequences': ['dna-repeats', 'verified'],
  'sum-of-scores-of-built-strings': ['prefix-score-sum', 'verified'],
  'text-justification': ['justify-lines', 'verified'],
  // Exact length-prefix format instead of "any encoding", so encode and decode are judgeable.
  'encode-and-decode-strings': ['string-codec', 'verified'],
  'concatenation-of-array': ['doubled-array', 'verified'],
  'detect-squares': ['square-counter', 'verified'],
  'sign-of-the-product-of-an-array': ['product-sign', 'verified'],
  'count-good-numbers': ['good-digit-strings', 'verified'],
  'nim-game': ['stone-take-game', 'verified'],
  'count-anagrams': ['anagram-arrangements', 'verified'],
  // Returns the next board instead of mutating it in place, so every harness can judge it.
  'game-of-life': ['life-step', 'verified'],
  // n raised to 10^6 with a modulus, so exponential recursion times out.
  'fibonacci-number': ['fibonacci-mod', 'verified'],
  // Wix wave (stage D)
  'container-with-most-water': ['two-wall-tank', 'verified'],
  'alien-dictionary': ['glyph-order', 'verified'],
  'all-nodes-distance-k-in-binary-tree': ['k-steps-away', 'verified'],
  'invalid-transactions': ['suspicious-payments', 'verified'],
  'is-subsequence': ['subsequence-check', 'verified'],
  'longest-string-chain': ['growing-word-chain', 'verified'],
  'design-hashset': ['bucket-set', 'verified'],
  'group-shifted-strings': ['caesar-groups', 'verified'],
  'intersection-of-two-arrays': ['common-values', 'verified'],
  'minimum-distance-between-bst-nodes': ['bst-min-gap', 'verified'],
  'palindrome-pairs': ['palindrome-joins', 'verified'],
  'employees-earning-more-than-their-managers': ['above-manager-pay', 'verified'],
  // Wave F2-1
  'reverse-words-in-a-string': ['word-order-flip', 'verified'],
  // Typed as 32-bit int in and out; the reversal itself needs a 64-bit intermediate.
  'reverse-integer': ['digit-flip', 'verified'],
  // Input and output are 64-bit integers in [0, 2^32), so the top bit is not a sign in any language.
  'reverse-bits': ['mirror-bits', 'verified'],
  // Returns the next arrangement instead of rewriting the array in place, so every harness can judge it.
  'next-permutation': ['next-arrangement', 'verified'],
  // Returns the rotated array instead of rewriting it in place.
  'rotate-array': ['ring-shift', 'verified'],
};

const WINDOWS = [
  ['1. Thirty Days.csv', '30d'],
  ['2. Three Months.csv', '3m'],
  ['3. Six Months.csv', '6m'],
  ['4. More Than Six Months.csv', 'older'],
];

const EST_MINUTES = { Easy: 15, Medium: 25, Hard: 40 };

/** Second company dataset (snehasishroy): lowercase-hyphen folder names, IDs and percentages. */
const WINDOWS_2 = [
  ['thirty-days.csv', '30d'],
  ['three-months.csv', '3m'],
  ['six-months.csv', '6m'],
  ['more-than-six-months.csv', 'older'],
];
const RECENCY_ORDER = ['30d', '3m', '6m', 'older', 'reported'];

/** A reported question has no measured frequency; this nominal value ranks it mid-pack. */
const REPORTED_FREQUENCY = 50;

/** Reasons that only add coverage; a problem selected for these alone is wave 2. */
const COVERAGE_REASONS = ['company-common', 'company-version', 'israeli-company', 'platform-practice'];

const companyKey = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Minimal RFC 4180 line parser: the CSVs quote the Topics column. */
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

async function readCsv(path) {
  let text;
  try { text = await readFile(path, 'utf8'); } catch { return []; }
  const [header, ...rows] = text.split(/\r?\n/).filter(Boolean);
  const cols = parseCsvLine(header);
  return rows.map((r) => Object.fromEntries(parseCsvLine(r).map((v, i) => [cols[i], v])));
}

const slugOf = (url) => url.replace(/\/+$/, '').split('/').pop();
const titleCase = (d) => d.charAt(0) + d.slice(1).toLowerCase();

/**
 * Places a contest rating inside the band of the official difficulty, so the 1-10 rating
 * orders problems without contradicting the Easy/Medium/Hard label.
 */
function ratingFor(difficulty, elo) {
  if (elo == null) return { Easy: 2, Medium: 5, Hard: 8 }[difficulty];
  const cuts = { Easy: [[1250, 1], [1400, 2], [Infinity, 3]], Medium: [[1500, 4], [1700, 5], [1900, 6], [Infinity, 7]], Hard: [[2000, 8], [2300, 9], [Infinity, 10]] }[difficulty];
  return cuts.find(([max]) => elo < max)[1];
}

/** Every topic the tags point at, most specific first, one entry per topic. */
function classifyAll(tags) {
  const set = new Set(tags);
  const seen = new Map();
  for (const [need, topic, concept] of TAG_RULES) {
    if (need.every((t) => set.has(t)) && !seen.has(topic)) seen.set(topic, concept);
  }
  return [...seen].map(([topic, concept]) => ({ topic, concept }));
}

function classify(tags) {
  const set = new Set(tags);
  for (const [need, topic, concept] of TAG_RULES) {
    if (need.every((t) => set.has(t))) return { topic, concept };
  }
  return { topic: 'arrays-hashing', concept: null };
}

async function main() {
  const problems = new Map();
  const ensure = (slug, init) => {
    if (!problems.has(slug)) {
      problems.set(slug, { slug, number: null, title: init.title, difficulty: init.difficulty, tags: init.tags ?? [], lists: [], companies: new Map(), neetcodePattern: null });
    }
    return problems.get(slug);
  };

  const companyDirs = (await readdir(join(CACHE, 'companies'), { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name);

  for (const company of companyDirs) {
    for (const row of await readCsv(join(CACHE, 'companies', company, '5. All.csv'))) {
      if (!row.Link) continue;
      const p = ensure(slugOf(row.Link), {
        title: row.Title,
        difficulty: titleCase(row.Difficulty),
        tags: row.Topics.split(',').map((t) => t.trim()).filter(Boolean),
      });
      p.companies.set(company, { name: company, frequency: Number(row.Frequency) || 0, recency: 'older' });
    }
    // Walk windows newest-first; the first window a problem appears in is its recency.
    for (const [file, label] of WINDOWS) {
      for (const row of await readCsv(join(CACHE, 'companies', company, file))) {
        const entry = problems.get(slugOf(row.Link ?? ''))?.companies.get(company);
        if (entry && WINDOWS.findIndex(([, l]) => l === entry.recency) > WINDOWS.findIndex(([, l]) => l === label)) {
          entry.recency = label;
        }
      }
    }
  }

  // Merge the second company dataset: it adds companies and fills problem numbers.
  const displayName = new Map(companyDirs.map((c) => [companyKey(c), c]));
  const dirs2 = (await readdir(join(CACHE, 'companies2'), { withFileTypes: true })).filter((d) => d.isDirectory() && !d.name.startsWith('.'));
  for (const dir of dirs2) {
    const key = companyKey(dir.name);
    if (!displayName.has(key)) displayName.set(key, dir.name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    const company = displayName.get(key);
    for (const row of await readCsv(join(CACHE, 'companies2', dir.name, 'all.csv'))) {
      if (!row.URL) continue;
      const p = ensure(slugOf(row.URL), { title: row.Title, difficulty: row.Difficulty });
      p.number ??= Number(row.ID) || null;
      const frequency = parseFloat(row['Frequency %']) || 0;
      const entry = p.companies.get(company);
      if (entry) entry.frequency = Math.max(entry.frequency, frequency);
      else p.companies.set(company, { name: company, frequency, recency: 'older' });
    }
    for (const [file, label] of WINDOWS_2) {
      for (const row of await readCsv(join(CACHE, 'companies2', dir.name, file))) {
        const entry = problems.get(slugOf(row.URL ?? ''))?.companies.get(company);
        if (entry && RECENCY_ORDER.indexOf(label) < RECENCY_ORDER.indexOf(entry.recency)) entry.recency = label;
      }
    }
  }

  const neetcode = JSON.parse(await readFile(join(CACHE, 'neetcode.json'), 'utf8'));
  for (const n of neetcode) {
    const topic = NEETCODE_PATTERNS[n.pattern];
    if (!topic) continue; // language-specific sections (e.g. "JavaScript") are not algorithm problems
    const slug = n.link.replace(/\/+$/, '');
    const p = ensure(slug, { title: n.problem, difficulty: n.difficulty });
    p.neetcodePattern = topic;
    p.number ??= Number(n.code.split('-')[0]) || null;
    if (n.blind75) p.lists.push('blind75');
    if (n.neetcode150) p.lists.push('neetcode150');
    p.lists.push('neetcode-all');
  }

  const elo = new Map();
  const ratingLines = (await readFile(join(CACHE, 'ratings.txt'), 'utf8')).split('\n').slice(1);
  for (const line of ratingLines) {
    const [rating, id, , , slug] = line.split('\t');
    if (slug) elo.set(slug, { rating: Number(rating), number: Number(id) });
  }

  // LeetCode's Top Interview 150 study plan, parsed from a public solutions index.
  {
    const byNumber = new Map();
    const byTitle = new Map();
    for (const p of problems.values()) {
      const n = p.number ?? elo.get(p.slug)?.number;
      if (n) byNumber.set(n, p);
      byTitle.set(p.title.toLowerCase(), p);
    }
    const lines = (await readFile(join(CACHE, 'lij.md'), 'utf8')).split('\n');
    let inPlan = false;
    for (const line of lines) {
      if (line.startsWith('### ')) inPlan = line.startsWith('### Top Interview 150');
      const m = inPlan && line.match(/^\| (\d{4}) \|\[([^\]]+)\]/);
      if (!m) continue;
      const p = byNumber.get(Number(m[1])) ?? byTitle.get(m[2].toLowerCase());
      if (!p) throw new Error(`Top Interview 150: ${m[2]} not in the index`);
      if (!p.lists.includes('top-interview-150')) p.lists.push('top-interview-150');
    }
  }

  // Other sites: facts and links only, placed in the network by hand.
  const externalSites = ['codility', 'original'];
  for (const site of externalSites) {
    const ext = JSON.parse(await readFile(join(ROOT, `content/external/${site}.json`), 'utf8'));
    for (const e of ext.problems) {
      problems.set(e.slug, {
        slug: e.slug, number: null, title: e.title, difficulty: e.difficulty, tags: [], lists: [ext.list ?? `${site}-lessons`],
        companies: new Map(), neetcodePattern: null, platform: site, url: e.url,
        fixedTopic: e.topic, fixedConcept: e.concept, equivalent: e.equivalent,
      });
    }
  }

  // Candidate reports for companies with little or no tag data.
  const { reports } = JSON.parse(await readFile(join(ROOT, 'content/reports.json'), 'utf8'));
  for (const r of reports.filter((x) => x.slug)) {
    const p = problems.get(r.slug);
    if (!p) throw new Error(`reports.json: ${r.slug} is not in the index`);
    if (!p.companies.has(r.company)) {
      p.companies.set(r.company, { name: r.company, frequency: REPORTED_FREQUENCY, recency: 'reported', source: r.source });
    }
  }

  // Hand-assigned topic/subtopic for core problems the ladders do not place.
  const { subtopics } = JSON.parse(await readFile(join(ROOT, 'content/subtopics.json'), 'utf8'));
  for (const slug of Object.keys(subtopics)) {
    if (!problems.has(slug)) throw new Error(`subtopics.json: ${slug} is not in the index`);
  }

  // Hand-curated ladders override topic and concept from the heuristics above.
  const ladders = JSON.parse(await readFile(join(ROOT, 'content/ladders.json'), 'utf8'));
  const ladderOf = new Map();
  for (const [topic, entries] of Object.entries(ladders)) {
    if (topic.startsWith('_')) continue;
    entries.forEach(([slug, concept], step) => {
      if (!problems.has(slug)) throw new Error(`ladders.json: ${slug} is not in the index`);
      if (ladderOf.has(slug)) throw new Error(`ladders.json: ${slug} is on two ladders`);
      ladderOf.set(slug, { topic, concept, step });
    });
  }

  // Core bank selection, driven by content/selection.json so thresholds are data, not code.
  const selection = JSON.parse(await readFile(join(ROOT, 'content/selection.json'), 'utf8'));
  const companyTop = new Set();
  const topCompanyNames = [];
  {
    const byCompany = new Map();
    for (const p of problems.values()) {
      for (const c of p.companies.values()) {
        if (!byCompany.has(c.name)) byCompany.set(c.name, []);
        byCompany.get(c.name).push([p.slug, c.frequency]);
      }
    }
    const { topCompanies, topPerCompany } = selection.wave2;
    const ranked = [...byCompany.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, topCompanies);
    topCompanyNames.push(...ranked.map(([name]) => name));
    ranked
      .map(([, list]) => list)
      // Same tie-break as the audit, so "top N" means the same problems in both.
      .forEach((list) => list.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, topPerCompany).forEach(([slug]) => companyTop.add(slug)));
  }
  // Families: the version each top company asks most becomes part of the bank, so a learner
  // targeting that company can be shown it.
  const { families } = JSON.parse(await readFile(join(ROOT, 'content/families.json'), 'utf8'));
  const familyOf = new Map();
  const companyVersions = new Set();
  const freqOf = (slug, company) => problems.get(slug)?.companies.get(company)?.frequency ?? 0;
  for (const f of families) {
    for (const m of f.members) familyOf.set(m.slug, f.id);
    for (const company of topCompanyNames) {
      const pick = pickVersion(f, company, freqOf);
      if (pick !== f.members[0].slug) companyVersions.add(pick);
    }
  }

  // Israeli companies: their most frequent problems join the bank even below the global thresholds.
  const companyGroups = JSON.parse(await readFile(join(ROOT, 'content/companies.json'), 'utf8'));
  const israeliTop = new Set();
  for (const company of companyGroups.israeli) {
    [...problems.values()]
      .filter((p) => p.companies.has(company))
      .sort((a, b) => b.companies.get(company).frequency - a.companies.get(company).frequency || a.slug.localeCompare(b.slug))
      .slice(0, selection.wave2.israeliTopPerCompany)
      .forEach((p) => israeliTop.add(p.slug));
  }

  /** Why a problem is in the core bank; empty means it stays index-only. */
  const coreReasons = (p, ladder) => {
    const why = [];
    const { wave1, wave2 } = selection;
    if (wave1.ladders && ladder) why.push('ladder');
    if (wave1.classicLists.some((l) => p.lists.includes(l))) why.push('classic');
    if (p.difficulty === 'Easy' && (wave1.easyClassics.lists.some((l) => p.lists.includes(l)) || p.companies.size >= wave1.easyClassics.minCompanies)) {
      why.push('easy-classic');
    }
    if (p.companies.size >= wave2.minCompanies || companyTop.has(p.slug)) why.push('company-common');
    if (companyVersions.has(p.slug)) why.push('company-version');
    if (israeliTop.has(p.slug)) why.push('israeli-company');
    if (wave2.platformLists.some((l) => p.lists.includes(l))) why.push('platform-practice');
    return why;
  };

  const maxCompanies = Math.max(...[...problems.values()].map((p) => p.companies.size));
  const records = [];
  for (const p of problems.values()) {
    if (!['Easy', 'Medium', 'Hard'].includes(p.difficulty)) continue;
    const contest = elo.get(p.slug);
    const fromTags = classify(p.tags);
    // NeetCode's hand-assigned pattern beats tag heuristics when both exist.
    const ladder = ladderOf.get(p.slug);
    // NeetCode files matrix problems (Spiral Matrix, Rotate Image) under "Math & Geometry".
    const neetcodeTopic = p.neetcodePattern === 'math-basics' && fromTags.topic === 'matrix' ? 'matrix' : p.neetcodePattern;
    const [subTopic, subConcept] = subtopics[p.slug]?.split('/') ?? [];
    const topic = ladder?.topic ?? subTopic ?? p.fixedTopic ?? neetcodeTopic ?? fromTags.topic;
    const concept = ladder?.concept ?? subConcept ?? p.fixedConcept ?? (topic === fromTags.topic ? fromTags.concept : null);
    // Secondary tags: the other topics a problem touches (Two Sum IV is also a tree problem).
    const secondary = classifyAll(p.tags).filter(
      (x) =>
        x.topic !== topic &&
        // Nearly every problem has an Array or Hash Table tag; that says nothing.
        !(x.topic === 'arrays-hashing' && x.concept === null) &&
        // DFS/BFS tags on tree and grid problems are traversal, not a graph topic.
        !(x.topic === 'graphs' && x.concept === null && ['trees', 'matrix', 'backtracking'].includes(topic)),
    );
    const companies = [...p.companies.values()].sort((a, b) => b.frequency - a.frequency);
    const recentShare = companies.length ? companies.filter((c) => ['30d', '3m', '6m'].includes(c.recency)).length / companies.length : 0;
    // Priority: how widely asked, whether a curated list picked it, and how recently it is asked.
    const priority =
      0.5 * (Math.log1p(companies.length) / Math.log1p(maxCompanies)) +
      0.3 * (p.lists.includes('neetcode150') ? 1 : p.lists.length ? 0.5 : 0) +
      0.2 * recentShare;
    const [contentId, authored] = CONTENT_IDS[p.slug] ?? [null, null];
    const why = coreReasons(p, ladder);
    // Wave 2 is company coverage: problems in the bank only because companies ask them.
    const wave = why.length === 0 ? null : why.some((r) => !COVERAGE_REASONS.includes(r)) ? 1 : 2;
    const status = authored ?? (wave ? 'selected' : 'indexed');
    records.push({
      slug: p.slug,
      number: p.number ?? contest?.number ?? null,
      title: p.title,
      difficulty: p.difficulty,
      rating: ratingFor(p.difficulty, contest?.rating),
      contestRating: contest ? Math.round(contest.rating) : null,
      topic,
      concept,
      secondary,
      tags: p.tags,
      estMinutes: EST_MINUTES[p.difficulty],
      platform: p.platform ?? 'leetcode',
      url: p.url ?? `https://leetcode.com/problems/${p.slug}/`,
      equivalent: p.equivalent ?? null,
      lists: p.lists,
      companyCount: companies.length,
      companies,
      priority: Math.round(priority * 1000) / 1000,
      ladderStep: ladder ? ladder.step : null,
      wave,
      core: why,
      family: familyOf.get(p.slug) ?? null,
      contentId,
      status,
    });
  }
  records.sort((a, b) => b.priority - a.priority || a.slug.localeCompare(b.slug));

  // Essential path: one problem per subtopic, the most asked. Ladder problems are curated for
  // teaching, so they win over the rest of the core bank; records are already priority-sorted.
  for (const t of TOPICS) {
    t.concepts.forEach((concept, i) => {
      const inSubtopic = records.filter((r) => r.wave !== null && r.topic === t.id && r.concept === concept);
      const pick = inSubtopic.find((r) => r.ladderStep !== null) ?? inSubtopic[0];
      if (!pick) throw new Error(`no core problem for subtopic ${t.id}/${concept}`);
      pick.essential = { tier: t.tier, order: i };
    });
  }
  for (const r of records) r.essential ??= null;

  const errors = [
    ...records.flatMap((r) => validateIndexRecord(r, TOPICS)),
    ...validateFamilies(families, new Map(records.map((r) => [r.slug, r]))),
  ];
  if (errors.length) {
    console.error(errors.slice(0, 20).join('\n'));
    process.exit(1);
  }

  await mkdir(join(ROOT, 'content/index'), { recursive: true });
  // One record per line: small enough to commit, and a rebuild diffs per problem.
  const header = { generatedFrom: ['liquidslr/leetcode-company-wise-problems', 'zerotrac/leetcode_problem_rating', 'neetcode-gh/leetcode'], count: records.length };
  const body = records.map((r) => '  ' + JSON.stringify(r)).join(',\n');
  await writeFile(OUT, JSON.stringify(header).slice(0, -1) + ',\n "problems": [\n' + body + '\n ]\n}\n');

  const byTopic = {};
  for (const r of records) byTopic[r.topic] = (byTopic[r.topic] ?? 0) + 1;
  const companyCount = new Set(records.flatMap((r) => r.companies.map((c) => c.name))).size;
  console.log(`${records.length} problems, ${companyCount} companies -> ${OUT}`);
  console.log(byTopic);
}

await main();
