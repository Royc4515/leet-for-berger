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
import { SQL_LANGUAGE, isSql, sqlSetup, sqlStarter, comparatorFor, tablesInputExample } from '../engine/sql.js';
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
import digitPalindrome from './digit-palindrome/problem.js';
import romanNumeralValue from './roman-numeral-value/problem.js';
import stringMultiply from './string-multiply/problem.js';
import primeCount from './prime-count/problem.js';
import powerMod from './power-mod/problem.js';
import stringGcd from './string-gcd/problem.js';
import spiralOrder from './spiral-order/problem.js';
import rotateGrid from './rotate-grid/problem.js';
import zeroRowsCols from './zero-rows-cols/problem.js';
import loneNumber from './lone-number/problem.js';
import bitCount from './bit-count/problem.js';
import addWithoutPlus from './add-without-plus/problem.js';
import circleElimination from './circle-elimination/problem.js';
import grammarSymbol from './grammar-symbol/problem.js';
import rainTrap from './rain-trap/problem.js';
import mergeSorted from './merge-sorted/problem.js';
import zerosToEnd from './zeros-to-end/problem.js';
import zeroTriplets from './zero-triplets/problem.js';
import bracketCheck from './bracket-check/problem.js';
import asteroidCollision from './asteroid-collision/problem.js';
import warmerDays from './warmer-days/problem.js';
import postfixEval from './postfix-eval/problem.js';
import productExceptSelf from './product-except-self/problem.js';
import subarraySumK from './subarray-sum-k/problem.js';
import regionSum from './region-sum/problem.js';
import rangeBookings from './range-bookings/problem.js';
import largestConcat from './largest-concat/problem.js';
import mergeRanges from './merge-ranges/problem.js';
import meetingRoomMinimizer from './meeting-room-minimizer/problem.js';
import smallerCount from './smaller-count/problem.js';
import longestDistinctWindow from './longest-distinct-window/problem.js';
import windowMaximums from './window-maximums/problem.js';
import coveringWindow from './covering-window/problem.js';
import vowelWindow from './vowel-window/problem.js';
import rotatedSearch from './rotated-search/problem.js';
import eatingSpeed from './eating-speed/problem.js';
import mergedMedian from './merged-median/problem.js';
import matrixSearch from './matrix-search/problem.js';
import targetRange from './target-range/problem.js';
import mountainPeak from './mountain-peak/problem.js';
import islandCount from './island-count/problem.js';
import courseCheck from './course-check/problem.js';
import courseOrder from './course-order/problem.js';
import wordMorph from './word-morph/problem.js';
import lockSteps from './lock-steps/problem.js';
import twoColorCheck from './two-color-check/problem.js';
import extraLink from './extra-link/problem.js';
import accountMerge from './account-merge/problem.js';
import limitedPaths from './limited-paths/problem.js';
import medianStream from './median-stream/problem.js';
import kthHighest from './kth-highest/problem.js';
import cooldownTasks from './cooldown-tasks/problem.js';
import noAdjacentRepeat from './no-adjacent-repeat/problem.js';
import rangeCover from './range-cover/problem.js';
import gridWord from './grid-word/problem.js';
import keypadWords from './keypad-words/problem.js';
import subsetBuilder from './subset-builder/problem.js';
import allOrderings from './all-orderings/problem.js';
import bestRunSum from './best-run-sum/problem.js';
import jumpReach from './jump-reach/problem.js';
import overlapTrim from './overlap-trim/problem.js';
import cookieMatch from './cookie-match/problem.js';
import oneSwapMax from './one-swap-max/problem.js';
import fewestCoins from './fewest-coins/problem.js';
import streetHeist from './street-heist/problem.js';
import stairPaths from './stair-paths/problem.js';
import risingChain from './rising-chain/problem.js';
import bestRunProduct from './best-run-product/problem.js';
import goodStringCount from './good-string-count/problem.js';
import greenProducts from './green-products/problem.js';
import addressLookup from './address-lookup/problem.js';
import repeatedEmails from './repeated-emails/problem.js';
import runnerUpSalary from './runner-up-salary/problem.js';
import tripleRepeat from './triple-repeat/problem.js';
import treeHeight from './tree-height/problem.js';
import bestTreePath from './best-tree-path/problem.js';
import kthInOrder from './kth-in-order/problem.js';
import treeHeist from './tree-heist/problem.js';
import treeCodec from './tree-codec/problem.js';
import editSteps from './edit-steps/problem.js';
import uphillPath from './uphill-path/problem.js';
import balloonPop from './balloon-pop/problem.js';
import coinCombos from './coin-combos/problem.js';
import tradeCooldown from './trade-cooldown/problem.js';
import sharedPrefix from './shared-prefix/problem.js';
import digitListSum from './digit-list-sum/problem.js';
import shiftList from './shift-list/problem.js';
import mergeManyLists from './merge-many-lists/problem.js';
import recentCache from './recent-cache/problem.js';
import frequentCache from './frequent-cache/problem.js';
import versionedStore from './versioned-store/problem.js';
import bucketMap from './bucket-map/problem.js';
import hitWindow from './hit-window/problem.js';
import prefixTree from './prefix-tree/problem.js';
import boardWords from './board-words/problem.js';
import listLoop from './list-loop/problem.js';
import randomLinkCopy from './random-link-copy/problem.js';
import nestedFlatten from './nested-flatten/problem.js';
import randomPool from './random-pool/problem.js';
import cheapestRouteKStops from './cheapest-route-k-stops/problem.js';
import ticketItinerary from './ticket-itinerary/problem.js';
import signalSpread from './signal-spread/problem.js';
import pointWiring from './point-wiring/problem.js';
import courseFinishTime from './course-finish-time/problem.js';
import obstacleClearing from './obstacle-clearing/problem.js';
import doubleInversions from './double-inversions/problem.js';
import skylineOutline from './skyline-outline/problem.js';
import visitAllNodes from './visit-all-nodes/problem.js';
import widestPalindrome from './widest-palindrome/problem.js';
import firstMatchIndex from './first-match-index/problem.js';
import dnaRepeats from './dna-repeats/problem.js';
import prefixScoreSum from './prefix-score-sum/problem.js';
import justifyLines from './justify-lines/problem.js';
import stringCodec from './string-codec/problem.js';
import doubledArray from './doubled-array/problem.js';
import squareCounter from './square-counter/problem.js';
import productSign from './product-sign/problem.js';
import goodDigitStrings from './good-digit-strings/problem.js';
import stoneTakeGame from './stone-take-game/problem.js';
import anagramArrangements from './anagram-arrangements/problem.js';
import lifeStep from './life-step/problem.js';
import fibonacciMod from './fibonacci-mod/problem.js';

export const TOPICS = [
  { id: 'arrays-strings', label: 'Arrays / Strings' },
  { id: 'greedy', label: 'Greedy' },
  { id: 'dp', label: 'Dynamic Programming' },
  { id: 'graphs', label: 'Graphs' },
  { id: 'trees', label: 'Trees' },
  { id: 'sql', label: 'SQL' },
];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

/**
 * Adds everything derived from a problem's neutral signature: per-language entry names and
 * starter code. Solutions are files in <id>/solutions and load on demand (see loadSolution).
 * @param {object} problem
 */
function hydrate(problem) {
  if (isSql(problem.signature)) return hydrateSql(problem);
  return {
    ...problem,
    languages: LANGUAGES,
    signatures: Object.fromEntries(LANGUAGE_IDS.map((l) => [l, { entry: entryName(l, problem.signature.name) }])),
    starterCode: Object.fromEntries(LANGUAGE_IDS.map((l) => [l, starterCode(l, problem.signature)])),
    // Browser-executable languages get a JSON <-> objects adapter when the signature needs one.
    // TypeScript runs as transpiled JavaScript (engine/typescript.js), so it takes the JavaScript one.
    adapters: { javascript: adapterFor('javascript', problem.signature), typescript: adapterFor('javascript', problem.signature), python: adapterFor('python', problem.signature) },
  };
}

/**
 * A SQL problem has one language and no function to call: the tables are the interface.
 * The worker gets the schema as its adapter, and judging compares result sets (engine/sql.js).
 * @param {object} problem
 */
function hydrateSql(problem) {
  const sig = problem.signature;
  return {
    ...problem,
    argNames: sig.tables.map((t) => t.name),
    languages: [SQL_LANGUAGE],
    signatures: { sql: { entry: 'query' } },
    starterCode: { sql: sqlStarter(sig) },
    adapters: { sql: sqlSetup(sig) },
    compare: comparatorFor(sig),
    customInputExample: tablesInputExample(sig, problem.visibleTests[0].args),
  };
}

const implemented = [smallestBaseSegment, notifyRecipients, reverseList, levelOrder, minStack, pairSumTarget, anagramBuckets, topKFrequent, longestStreak, isomorphicStrings, ticketQueue, digitPalindrome, romanNumeralValue, stringMultiply, primeCount, powerMod, stringGcd, spiralOrder, rotateGrid, zeroRowsCols, loneNumber, bitCount, addWithoutPlus, circleElimination, grammarSymbol, rainTrap, mergeSorted, zerosToEnd, zeroTriplets, bracketCheck, asteroidCollision, warmerDays, postfixEval, productExceptSelf, subarraySumK, regionSum, rangeBookings, largestConcat, mergeRanges, meetingRoomMinimizer, smallerCount, longestDistinctWindow, windowMaximums, coveringWindow, vowelWindow, rotatedSearch, eatingSpeed, mergedMedian, matrixSearch, targetRange, mountainPeak, islandCount, courseCheck, courseOrder, wordMorph, lockSteps, twoColorCheck, extraLink, accountMerge, limitedPaths, medianStream, kthHighest, cooldownTasks, noAdjacentRepeat, rangeCover, gridWord, keypadWords, subsetBuilder, allOrderings, bestRunSum, jumpReach, overlapTrim, cookieMatch, oneSwapMax, fewestCoins, streetHeist, stairPaths, risingChain, bestRunProduct, goodStringCount, greenProducts, addressLookup, repeatedEmails, runnerUpSalary, tripleRepeat, treeHeight, bestTreePath, kthInOrder, treeHeist, treeCodec, editSteps, uphillPath, balloonPop, coinCombos, tradeCooldown, sharedPrefix, digitListSum, shiftList, mergeManyLists, recentCache, frequentCache, versionedStore, bucketMap, hitWindow, prefixTree, boardWords, cheapestRouteKStops, ticketItinerary, signalSpread, pointWiring, courseFinishTime, obstacleClearing, doubleInversions, skylineOutline, visitAllNodes, widestPalindrome, firstMatchIndex, dnaRepeats, prefixScoreSum, justifyLines, stringCodec, doubledArray, squareCounter, productSign, goodDigitStrings, stoneTakeGame, anagramArrangements, lifeStep, fibonacciMod].map(hydrate);
// Problems on the input types added later (ListNode@cycle, RandomListNode, NestedInteger[]) and the
// randomized-set judge mode. A separate line keeps parallel content waves from colliding above.
implemented.push(...[listLoop, randomLinkCopy, nestedFlatten, randomPool].map(hydrate));

/**
 * URL of a problem's solution file for a language.
 * @param {string} problemId
 * @param {string} lang
 */
export function solutionUrl(problemId, lang) {
  const file = [...LANGUAGES, SQL_LANGUAGE].find((l) => l.id === lang)?.file;
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

/** @type {{id:string,title:string,difficulty:string,topics:string[]}[]} */
const planned = [
  { id: 'mirror-check', title: 'Mirror Check (Two Pointers)', difficulty: 'Easy', topics: ['arrays-strings'] },
  { id: 'tree-level-sums', title: 'Tree Level Sums', difficulty: 'Easy', topics: ['trees'] },
  { id: 'lowest-shared-ancestor', title: 'Lowest Shared Ancestor', difficulty: 'Medium', topics: ['trees'] },
  { id: 'k-closest-points', title: 'K Closest Points (Heap)', difficulty: 'Medium', topics: ['arrays-strings'] },
  { id: 'grid-min-path', title: 'Grid Minimum Path', difficulty: 'Medium', topics: ['dp'] },
];

const byId = new Map(implemented.map((p) => [p.id, p]));

/** Full catalog for listing UIs. */
export const catalog = [
  ...implemented.map((p) => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    topics: p.topics,
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
