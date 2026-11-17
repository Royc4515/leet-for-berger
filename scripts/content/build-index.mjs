// Builds content/index/problems.json from the datasets in content/.cache.
// Usage: bash scripts/content/fetch-sources.sh && node scripts/content/build-index.mjs
//
// The index holds facts and links only (title, difficulty, tags, company signals). Problem
// statements and tests are written separately in src/js/problems/.
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { TOPICS, validateIndexRecord } from '../../src/js/data/taxonomy.js';

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
  [['Range Minimum/Maximum Query'], 'range-queries', 'sparse-table'],
  [['Sparse Table'], 'range-queries', 'sparse-table'],
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

/** Problems already authored or planned in the app, keyed by LeetCode slug. */
const CONTENT_IDS = {
  'repeated-substring-pattern': ['smallest-base-segment', 'verified'],
  'two-sum': ['pair-sum-target', 'selected'],
  'group-anagrams': ['anagram-buckets', 'selected'],
  'valid-palindrome': ['mirror-check', 'selected'],
  'longest-substring-without-repeating-characters': ['longest-distinct-window', 'selected'],
  'meeting-rooms-ii': ['meeting-room-minimizer', 'selected'],
  'search-in-rotated-sorted-array': ['rotated-search', 'selected'],
  'jump-game': ['jump-reach', 'selected'],
  'maximum-level-sum-of-a-binary-tree': ['tree-level-sums', 'selected'],
  'lowest-common-ancestor-of-a-binary-tree': ['lowest-shared-ancestor', 'selected'],
  'number-of-islands': ['island-count', 'selected'],
  'k-closest-points-to-origin': ['k-closest-points', 'selected'],
  subsets: ['subset-builder', 'selected'],
  'climbing-stairs': ['stair-paths', 'selected'],
  'edit-distance': ['edit-distance-lite', 'selected'],
  'minimum-path-sum': ['grid-min-path', 'selected'],
  'cheapest-flights-within-k-stops': ['cheapest-route-k-stops', 'selected'],
};

const WINDOWS = [
  ['1. Thirty Days.csv', '30d'],
  ['2. Three Months.csv', '3m'],
  ['3. Six Months.csv', '6m'],
  ['4. More Than Six Months.csv', 'older'],
];

const EST_MINUTES = { Easy: 15, Medium: 25, Hard: 40 };

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

  const maxCompanies = Math.max(...[...problems.values()].map((p) => p.companies.size));
  const records = [];
  for (const p of problems.values()) {
    if (!['Easy', 'Medium', 'Hard'].includes(p.difficulty)) continue;
    const contest = elo.get(p.slug);
    const fromTags = classify(p.tags);
    // NeetCode's hand-assigned pattern beats tag heuristics when both exist.
    const topic = p.neetcodePattern ?? fromTags.topic;
    const concept = topic === fromTags.topic ? fromTags.concept : null;
    const companies = [...p.companies.values()].sort((a, b) => b.frequency - a.frequency);
    const recentShare = companies.length ? companies.filter((c) => c.recency !== 'older').length / companies.length : 0;
    // Priority: how widely asked, whether a curated list picked it, and how recently it is asked.
    const priority =
      0.5 * (Math.log1p(companies.length) / Math.log1p(maxCompanies)) +
      0.3 * (p.lists.includes('neetcode150') ? 1 : p.lists.length ? 0.5 : 0) +
      0.2 * recentShare;
    const [contentId, status] = CONTENT_IDS[p.slug] ?? [null, 'indexed'];
    records.push({
      slug: p.slug,
      number: p.number ?? contest?.number ?? null,
      title: p.title,
      difficulty: p.difficulty,
      rating: ratingFor(p.difficulty, contest?.rating),
      contestRating: contest ? Math.round(contest.rating) : null,
      topic,
      concept,
      tags: p.tags,
      estMinutes: EST_MINUTES[p.difficulty],
      url: `https://leetcode.com/problems/${p.slug}/`,
      lists: p.lists,
      companyCount: companies.length,
      companies,
      priority: Math.round(priority * 1000) / 1000,
      contentId,
      status,
    });
  }
  records.sort((a, b) => b.priority - a.priority || a.slug.localeCompare(b.slug));

  const errors = records.flatMap((r) => validateIndexRecord(r, TOPICS));
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
  console.log(`${records.length} problems from ${companyDirs.length} companies -> ${OUT}`);
  console.log(byTopic);
}

await main();
