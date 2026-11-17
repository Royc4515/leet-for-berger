/**
 * Problem bank.
 *
 * `implemented` problems have full modules (statement, 15 tests, solutions).
 * `planned` entries are catalog metadata only, so the dashboard and learning path can
 * show the full curriculum shape before every problem is authored.
 * To add a problem: see docs/PROBLEM_FORMAT.md or run the /add-problem Claude Code command.
 */
import { LANGUAGES, LANGUAGE_IDS, entryName, starterCode } from '../engine/codegen.js';
import { adapterFor } from '../engine/adapters.js';
import smallestBaseSegment from './smallest-base-segment/problem.js';
import notifyRecipients from './notify-recipients/problem.js';
import reverseList from './reverse-list/problem.js';
import levelOrder from './level-order/problem.js';
import minStack from './min-stack/problem.js';
import pairSumTarget from './pair-sum-target/problem.js';
import anagramBuckets from './anagram-buckets/problem.js';
import topKFrequent from './top-k-frequent/problem.js';
import longestStreak from './longest-streak/problem.js';
import isomorphicStrings from './isomorphic-strings/problem.js';
import ticketQueue from './ticket-queue/problem.js';
import spiralOrder from './spiral-order/problem.js';
import rotateGrid from './rotate-grid/problem.js';
import zeroRowsCols from './zero-rows-cols/problem.js';
import loneNumber from './lone-number/problem.js';
import bitCount from './bit-count/problem.js';
import addWithoutPlus from './add-without-plus/problem.js';
import circleElimination from './circle-elimination/problem.js';
import grammarSymbol from './grammar-symbol/problem.js';

export const TOPICS = [
  { id: 'arrays-strings', label: 'Arrays / Strings' },
  { id: 'greedy', label: 'Greedy' },
  { id: 'dp', label: 'Dynamic Programming' },
  { id: 'graphs', label: 'Graphs' },
  { id: 'trees', label: 'Trees' },
];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

/**
 * Adds everything derived from a problem's neutral signature: per-language entry names and
 * starter code. Solutions are files in <id>/solutions and load on demand (see loadSolution).
 * @param {object} problem
 */
function hydrate(problem) {
  return {
    ...problem,
    signatures: Object.fromEntries(LANGUAGE_IDS.map((l) => [l, { entry: entryName(l, problem.signature.name) }])),
    starterCode: Object.fromEntries(LANGUAGE_IDS.map((l) => [l, starterCode(l, problem.signature)])),
    // Browser-executable languages get a JSON <-> objects adapter when the signature needs one.
    adapters: { javascript: adapterFor('javascript', problem.signature), python: adapterFor('python', problem.signature) },
  };
}

const implemented = [smallestBaseSegment, notifyRecipients, reverseList, levelOrder, minStack, pairSumTarget, anagramBuckets, topKFrequent, longestStreak, isomorphicStrings, ticketQueue, spiralOrder, rotateGrid, zeroRowsCols, loneNumber, bitCount, addWithoutPlus, circleElimination, grammarSymbol].map(hydrate);

/**
 * URL of a problem's solution file for a language.
 * @param {string} problemId
 * @param {string} lang
 */
export function solutionUrl(problemId, lang) {
  const file = LANGUAGES.find((l) => l.id === lang)?.file;
  if (!file) throw new Error(`Unknown language "${lang}"`);
  return new URL(`./${problemId}/solutions/${file}`, import.meta.url).href;
}

/**
 * Fetches the reference solution for "Reveal Solution". Solutions are separate files (not
 * bundled into the module) so every language is a real, compilable file the verifier checks.
 * @param {string} problemId
 * @param {string} lang
 * @returns {Promise<string>}
 */
export async function loadSolution(problemId, lang) {
  const res = await fetch(solutionUrl(problemId, lang));
  if (!res.ok) throw new Error(`No ${lang} solution for ${problemId} (${res.status})`);
  return res.text();
}

/** @type {{id:string,title:string,difficulty:string,topics:string[],milestone:number}[]} */
const planned = [
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
