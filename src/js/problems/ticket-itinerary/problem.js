/**
 * Problem: Ticket Itinerary
 *
 * Use every ticket exactly once, starting at JFK, and return the lexicographically smallest
 * itinerary. That is an Eulerian path, and Hierholzer's algorithm builds it in O(E log E): always
 * take the smallest unused ticket out of the current airport; when an airport has none left,
 * it is final, so it goes to the front of the answer (the answer is built back to front). A
 * greedy walk without that rule gets stuck in a dead end; backtracking works but can explode.
 *
 * The trap is depth: a recursive Hierholzer recurses once per ticket, and the hidden tests have
 * 30,000 tickets, beyond Python's recursion limit and a browser's call stack. The statement says
 * so; an explicit stack is expected.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_T = 30000;
const CODE = /^[A-Z]{3}$/;

/**
 * Reference: iterative Hierholzer over destination lists sorted in descending order, so the
 * smallest unused destination is always at the end.
 * @param {string[][]} tickets
 * @returns {string[]}
 */
export function reference(tickets) {
  const out = new Map();
  for (const [from, to] of tickets) {
    if (!out.has(from)) out.set(from, []);
    out.get(from).push(to);
  }
  for (const list of out.values()) list.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  const stack = ['JFK'];
  const route = [];
  while (stack.length) {
    const list = out.get(stack[stack.length - 1]);
    if (list && list.length) stack.push(list.pop());
    else route.push(stack.pop());
  }
  return route.reverse();
}

/** Seeded airport codes: JFK plus `count - 1` other distinct codes. */
function airports(rnd, count) {
  const set = new Set(['JFK']);
  while (set.size < count) {
    set.add(Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(rnd() * 26))).join(''));
  }
  return [...set];
}

/** Fisher-Yates with the seeded generator. */
function shuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * A random walk of `length` flights from JFK over `count` airports, cut into shuffled tickets,
 * so a valid itinerary exists (the walk) and usually many others.
 */
function randomWalk(seed, length, count) {
  const rnd = mulberry32(seed);
  const codes = airports(rnd, count);
  const tickets = [];
  let at = 'JFK';
  for (let i = 0; i < length; i++) {
    let to = codes[Math.floor(rnd() * count)];
    while (to === at) to = codes[Math.floor(rnd() * count)];
    tickets.push([at, to]);
    at = to;
  }
  return [shuffle(tickets, rnd)];
}

/**
 * A star of round trips JFK -> X -> JFK plus one one-way ticket to the airport that sorts first.
 * A greedy walker takes that ticket first and is stranded; the answer must save it for last.
 */
function starWithDeadEnd(seed, loops) {
  const rnd = mulberry32(seed);
  const codes = airports(rnd, loops + 2).filter((c) => c !== 'JFK').sort();
  const dead = codes[0];
  const tickets = [['JFK', dead]];
  for (let i = 1; i <= loops; i++) tickets.push(['JFK', codes[i]], [codes[i], 'JFK']);
  return [shuffle(tickets, rnd)];
}

const visible = [
  { args: [[['JFK', 'SFO'], ['SFO', 'ATL'], ['ATL', 'LAX']]], expected: ['JFK', 'SFO', 'ATL', 'LAX'], note: 'Only one order uses every ticket.' },
  { args: [[['JFK', 'ATL'], ['JFK', 'SFO'], ['SFO', 'JFK'], ['ATL', 'JFK']]], expected: ['JFK', 'ATL', 'JFK', 'SFO', 'JFK'], note: 'Two valid orders; ATL comes before SFO.' },
  { args: [[['JFK', 'AAA'], ['JFK', 'BBB'], ['BBB', 'JFK']]], expected: ['JFK', 'BBB', 'JFK', 'AAA'], note: 'Going to AAA first would strand the other two tickets, so it must wait until the end.' },
  { args: [[['JFK', 'MUC'], ['MUC', 'JFK'], ['JFK', 'MUC'], ['MUC', 'LHR']]], expected: ['JFK', 'MUC', 'JFK', 'MUC', 'LHR'], note: 'Duplicate tickets are separate tickets; each is used once.' },
  { args: [[['TLV', 'JFK'], ['JFK', 'TLV']]], expected: ['JFK', 'TLV', 'JFK'], note: 'The trip always starts at JFK, even if another ticket is listed first.' },
];

// Hidden tests: one ticket, a dead end with the smaller name, nested loops, repeated tickets,
// a dead end reached late, random walks of growing size, a 29,999-ticket star whose smallest
// destination is a dead end, and two 30,000-ticket walks that overflow a recursive solution.
const hiddenArgs = [
  [[['JFK', 'KUL']]],
  [[['JFK', 'KUL'], ['JFK', 'NRT'], ['NRT', 'JFK']]],
  [[['JFK', 'ORD'], ['ORD', 'JFK'], ['JFK', 'DEN'], ['DEN', 'ORD'], ['ORD', 'DEN'], ['DEN', 'JFK'], ['JFK', 'BOS'], ['BOS', 'JFK']]],
  [[['JFK', 'AAA'], ['AAA', 'JFK'], ['JFK', 'AAA'], ['AAA', 'JFK'], ['JFK', 'AAA'], ['AAA', 'BBB'], ['BBB', 'AAA']]],
  [[['JFK', 'LHR'], ['LHR', 'JFK'], ['JFK', 'CDG'], ['CDG', 'LHR'], ['LHR', 'CDG'], ['CDG', 'JFK'], ['JFK', 'AMS']]],
  randomWalk(7, 40, 5),
  randomWalk(11, 2000, 60),
  starWithDeadEnd(13, (MAX_T - 2) / 2),
  randomWalk(17, MAX_T, 30),
  randomWalk(19, MAX_T, 3000),
];

export const problem = {
  id: 'ticket-itinerary',
  title: 'Ticket Itinerary',
  difficulty: 'Hard',
  topics: ['graphs'],
  patterns: ['Eulerian Path', "Hierholzer's Algorithm", 'Iterative DFS'],
  timeLimitMs: 3000,
  argNames: ['tickets'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You hold a pile of one-way plane tickets; <code>tickets[i] = [from, to]</code> flies from
    airport <code>from</code> to airport <code>to</code>. Airports are three uppercase letters.</p>
    <p>Starting at <code>"JFK"</code>, plan a trip that uses <strong>every ticket exactly
    once</strong> and return it as the list of airports visited, in order. The tickets are
    guaranteed to allow at least one such trip.</p>
    <p>When several trips are possible, return the one that is smallest in lexicographic order
    when the list is compared airport by airport (so <code>["JFK", "ATL", ...]</code> comes
    before <code>["JFK", "SFO", ...]</code>).</p>
    <p>Note: there can be 30,000 tickets, so a recursive search can run out of call stack. Use
    an explicit stack.</p>
  `,
  constraints: [
    '1 <= tickets.length <= 3 * 10^4',
    'Every airport code is exactly three uppercase letters A-Z; from != to',
    'The same ticket may appear several times; each copy must be used once',
    'At least one trip from JFK uses every ticket',
    'A recursive search can go 3 * 10^4 calls deep: too deep for Python and browsers',
    'Target complexity: O(E log E) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `tickets = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you always fly to the alphabetically smallest unused destination, how can you get stuck?',
    'When you are stuck at an airport with no tickets left, where must that airport sit in the final trip?',
    'Can you build the trip from its end backwards, adding an airport only when it has no unused tickets?',
    'With 30,000 tickets, how do you replace the recursion with a stack you manage yourself?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'findItinerary',
    params: [{ name: 'tickets', type: 'string[][]' }],
    returns: 'string[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: tickets as a JSON array of [from, to] pairs. The trip must exist, which is
   * checked by building one and confirming it used every ticket.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let tickets;
    try {
      tickets = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter tickets as a JSON array, for example [["JFK","SFO"],["SFO","ATL"]].' };
    }
    if (!Array.isArray(tickets) || tickets.length < 1 || tickets.length > MAX_T) return { ok: false, error: 'tickets must have 1 to 3 * 10^4 entries.' };
    for (const t of tickets) {
      if (!Array.isArray(t) || t.length !== 2 || !t.every((c) => typeof c === 'string' && CODE.test(c))) return { ok: false, error: 'Each ticket must be two airport codes of three uppercase letters.' };
      if (t[0] === t[1]) return { ok: false, error: 'A ticket must fly between two different airports.' };
    }
    // Hierholzer from JFK always returns some sequence, but without a valid trip it can skip
    // tickets or join two partial walks with a step no ticket covers, so check both.
    const trip = reference(tickets);
    if (trip.length !== tickets.length + 1 || !tripUsesTickets(trip, tickets)) return { ok: false, error: 'No trip from JFK uses every ticket exactly once.' };
    return { ok: true, args: [tickets] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

/** True when consecutive airports of `trip` are exactly the multiset of tickets. */
function tripUsesTickets(trip, tickets) {
  const count = new Map();
  for (const [a, b] of tickets) count.set(`${a}${b}`, (count.get(`${a}${b}`) ?? 0) + 1);
  for (let i = 1; i < trip.length; i++) {
    const key = `${trip[i - 1]}${trip[i]}`;
    const c = count.get(key);
    if (!c) return false;
    count.set(key, c - 1);
  }
  return true;
}

export default problem;
