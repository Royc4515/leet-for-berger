/**
 * Problem bank.
 *
 * `implemented` problems have full modules (statement, 15 tests, solutions).
 * `planned` entries are catalog metadata only, so the dashboard and learning path can
 * show the full curriculum shape before every problem is authored.
 * To add a problem: see docs/PROBLEM_FORMAT.md or run the /add-problem Claude Code command.
 */
import smallestBaseSegment from './smallest-base-segment.js';
import notifyRecipients from './notify-recipients.js';

export const TOPICS = [
  { id: 'arrays-strings', label: 'Arrays / Strings' },
  { id: 'greedy', label: 'Greedy' },
  { id: 'dp', label: 'Dynamic Programming' },
  { id: 'graphs', label: 'Graphs' },
  { id: 'trees', label: 'Trees' },
];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const implemented = [smallestBaseSegment, notifyRecipients];

/** @type {{id:string,title:string,difficulty:string,topics:string[],milestone:number}[]} */
const planned = [
  { id: 'pair-sum-target', title: 'Pair Sum Target', difficulty: 'Easy', topics: ['arrays-strings'], milestone: 1 },
  { id: 'anagram-buckets', title: 'Anagram Buckets', difficulty: 'Medium', topics: ['arrays-strings'], milestone: 1 },
  { id: 'mirror-check', title: 'Mirror Check (Two Pointers)', difficulty: 'Easy', topics: ['arrays-strings'], milestone: 1 },
  { id: 'longest-distinct-window', title: 'Longest Distinct Window', difficulty: 'Medium', topics: ['arrays-strings'], milestone: 2 },
  { id: 'meeting-room-minimizer', title: 'Meeting Room Minimizer', difficulty: 'Medium', topics: ['greedy'], milestone: 2 },
  { id: 'rotated-search', title: 'Search in Rotated Array', difficulty: 'Medium', topics: ['arrays-strings'], milestone: 2 },
  { id: 'jump-reach', title: 'Jump Reach', difficulty: 'Medium', topics: ['greedy'], milestone: 2 },
  { id: 'tree-level-sums', title: 'Tree Level Sums', difficulty: 'Easy', topics: ['trees'], milestone: 3 },
  { id: 'lowest-shared-ancestor', title: 'Lowest Shared Ancestor', difficulty: 'Medium', topics: ['trees'], milestone: 3 },
  { id: 'island-count', title: 'Island Count', difficulty: 'Medium', topics: ['graphs'], milestone: 3 },
  { id: 'k-closest-points', title: 'K Closest Points (Heap)', difficulty: 'Medium', topics: ['arrays-strings'], milestone: 3 },
  { id: 'subset-builder', title: 'Subset Builder (Backtracking)', difficulty: 'Medium', topics: ['arrays-strings'], milestone: 3 },
  { id: 'stair-paths', title: 'Stair Paths', difficulty: 'Easy', topics: ['dp'], milestone: 4 },
  { id: 'edit-distance-lite', title: 'Edit Distance Lite', difficulty: 'Hard', topics: ['dp'], milestone: 4 },
  { id: 'grid-min-path', title: 'Grid Minimum Path', difficulty: 'Medium', topics: ['dp'], milestone: 4 },
  { id: 'cheapest-route-k-stops', title: 'Cheapest Route Within K Stops', difficulty: 'Hard', topics: ['graphs'], milestone: 4 },
];

const byId = new Map(implemented.map((p) => [p.id, p]));

/** Full catalog for listing UIs. */
export const catalog = [
  ...implemented.map((p) => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    topics: p.topics,
    milestone: p.milestone,
    status: 'available',
  })),
  ...planned.map((p) => ({ ...p, status: 'planned' })),
];

/** @param {string} id */
export function getProblem(id) {
  return byId.get(id) ?? null;
}

export function availableProblems() {
  return implemented;
}
