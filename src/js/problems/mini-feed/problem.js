/**
 * Problem: Mini Feed (design)
 *
 * Related to LeetCode 355 (Design Twitter); statement and tests are written for this project. Users
 * post tweets, follow and unfollow each other, and ask for a news feed: the 10 most recent tweets by
 * themselves and the users they follow. Each user keeps their own tweets newest first (a linked list
 * threaded through one global array), so a feed is a merge of already sorted lists: a max-heap holds
 * the newest unread tweet of each followed user, and 10 pops give the feed. That is O(F + 10 log F)
 * per feed for F followed users, no matter how many tweets exist.
 *
 * Unlike the original, every post carries an explicit timestamp, and the tie rule is part of the
 * statement: a tweet with a larger timestamp is more recent, and between equal timestamps the tweet
 * posted by the later call is more recent. Timestamps never decrease from one post call to the
 * next, so call order alone is a valid recency key; a heap that compares timestamps only returns
 * equal-timestamp tweets in an arbitrary order and fails the tests with bursts of equal timestamps.
 *
 * Classic wrong answers: collecting every tweet of every followed user and sorting (O(total tweets)
 * per feed, billions of steps on the max tests), breaking timestamp ties arbitrarily, showing a
 * followed user twice or the user's own tweets twice after a self-follow, keeping the tweets of a
 * user who was unfollowed, and letting a user unfollow themselves.
 *
 * A design problem is tested as a sequence of calls: args are [operations, argumentLists] and the
 * expected value lists every call's result (null for the constructor and void methods).
 */

import { mulberry32 } from '../../engine/rng.js';
import { randInt } from '../../engine/growth-inputs.js';

const MAX_CALLS = 100000;
const MAX_USER = 100000;
const MAX_VAL = 1000000000;
const MAX_FOLLOWING = 1000;
const FEED_SIZE = 10;

/**
 * Reference simulation: per-user tweet lists merged with a max-heap keyed by call order.
 * @param {string[]} ops operation names, ops[0] === 'MiniFeed'
 * @param {number[][]} args argument list per operation
 * @returns {(number[]|null)[]}
 */
export function reference(ops, args) {
  const ids = []; // tweet id by posting order (the recency key)
  const mine = new Map(); // user -> posting-order indices, oldest first
  const follows = new Map(); // user -> Set of followed users
  return ops.map((op, i) => {
    if (op === 'post') {
      const [user, tweetId] = args[i];
      if (!mine.has(user)) mine.set(user, []);
      mine.get(user).push(ids.length);
      ids.push(tweetId);
      return null;
    }
    if (op === 'follow') {
      const [a, b] = args[i];
      if (a !== b) {
        if (!follows.has(a)) follows.set(a, new Set());
        follows.get(a).add(b);
      }
      return null;
    }
    if (op === 'unfollow') {
      const [a, b] = args[i];
      follows.get(a)?.delete(b);
      return null;
    }
    if (op !== 'getFeed') return null; // constructor
    const user = args[i][0];
    // Heap of [postingOrder, owner, position in the owner's list]; the largest order pops first.
    const heap = [];
    const push = (e) => {
      heap.push(e);
      let c = heap.length - 1;
      while (c > 0) {
        const p = (c - 1) >> 1;
        if (heap[p][0] >= heap[c][0]) break;
        [heap[p], heap[c]] = [heap[c], heap[p]];
        c = p;
      }
    };
    const pop = () => {
      const top = heap[0];
      const last = heap.pop();
      if (heap.length > 0) {
        heap[0] = last;
        let p = 0;
        for (;;) {
          let big = p;
          for (const c of [2 * p + 1, 2 * p + 2]) if (c < heap.length && heap[c][0] > heap[big][0]) big = c;
          if (big === p) break;
          [heap[p], heap[big]] = [heap[big], heap[p]];
          p = big;
        }
      }
      return top;
    };
    for (const u of [user, ...(follows.get(user) ?? [])]) {
      const list = mine.get(u);
      if (list) push([list[list.length - 1], u, list.length - 1]);
    }
    const feed = [];
    while (feed.length < FEED_SIZE && heap.length > 0) {
      const [order, owner, pos] = pop();
      feed.push(ids[order]);
      if (pos > 0) push([mine.get(owner)[pos - 1], owner, pos - 1]);
    }
    return feed;
  });
}

/**
 * A scripted test builder: collects the calls and the arguments.
 * @returns {{ post: Function, follow: Function, unfollow: Function, feed: Function, done: () => unknown[] }}
 */
function script() {
  const ops = ['MiniFeed'];
  const args = [[]];
  const add = (op, ...a) => {
    ops.push(op);
    args.push(a);
  };
  return {
    post: (user, tweetId, time) => add('post', user, tweetId, time),
    follow: (a, b) => add('follow', a, b),
    unfollow: (a, b) => add('unfollow', a, b),
    feed: (user) => add('getFeed', user),
    done: () => [ops, args],
  };
}

/** Distinct tweet ids up to 10^9 from a counter. */
const tweetIdOf = (k) => 1 + k * 7919;

/**
 * A seeded random session on `users` users: posts, feeds, follows and unfollows in the given
 * proportions, timestamps that grow slowly (so many posts share one), at most 1000 followees each.
 */
function randomSession(seed, users, calls, { post = 0.4, feed = 0.4 } = {}) {
  const rnd = mulberry32(seed);
  const s = script();
  const following = new Map();
  let tweets = 0;
  let time = 1;
  while (s.done()[0].length < calls) {
    const r = rnd();
    const u = randInt(rnd, 1, users);
    if (r < post) {
      if (rnd() < 0.3) time++;
      s.post(u, tweetIdOf(tweets++), time);
    } else if (r < post + feed) {
      s.feed(u);
    } else {
      const v = randInt(rnd, 1, users);
      if (!following.has(u)) following.set(u, new Set());
      const set = following.get(u);
      if (rnd() < 0.7) {
        if (set.has(v) || v === u || set.size < MAX_FOLLOWING) {
          s.follow(u, v);
          if (v !== u) set.add(v);
        }
      } else {
        s.unfollow(u, v);
        set.delete(v);
      }
    }
  }
  return s.done();
}

/** User 1 follows `followees` users; `posts` tweets are spread over them, then feeds of user 1 fill the 10^5 calls. */
function fanIn(seed, followees, posts) {
  const rnd = mulberry32(seed);
  const s = script();
  for (let u = 2; u <= 1 + followees; u++) s.follow(1, u);
  let time = 1;
  for (let k = 0; k < posts; k++) {
    if (rnd() < 0.2) time++;
    s.post(randInt(rnd, 2, 1 + followees), tweetIdOf(k), time);
  }
  while (s.done()[0].length < MAX_CALLS) s.feed(1);
  return s.done();
}

/** One user posts a lot and asks for their own feed after every few posts. */
function singleAuthor(posts, feeds) {
  const s = script();
  for (let k = 0; k < posts; k++) s.post(7, tweetIdOf(k), k + 1);
  for (let k = 0; k < feeds; k++) s.feed(7);
  return s.done();
}

/** Bursts of `burst` posts that all share one timestamp, from three users who are followed by a fourth. */
function equalTimestampBursts(calls, burst) {
  const s = script();
  s.follow(4, 1);
  s.follow(4, 2);
  s.follow(4, 3);
  let k = 0;
  let time = 1;
  while (s.done()[0].length < calls - 1) {
    for (let b = 0; b < burst && s.done()[0].length < calls - 1; b++) s.post(1 + (k % 3), tweetIdOf(k++), time);
    time++;
    if (s.done()[0].length < calls - 1) s.feed(4);
  }
  s.feed(4);
  return s.done();
}

const visible = [
  (() => {
    const s = script();
    s.post(1, 5, 1);
    s.feed(1);
    s.follow(1, 2);
    s.post(2, 6, 2);
    s.feed(1);
    s.unfollow(1, 2);
    s.feed(1);
    return { args: s.done(), expected: [null, null, [5], null, null, [6, 5], null, [5]], note: 'User 1 sees user 2\'s tweet only while following them.' };
  })(),
  (() => {
    const s = script();
    s.post(1, 10, 7);
    s.post(2, 20, 7);
    s.post(1, 30, 7);
    s.follow(1, 2);
    s.feed(1);
    return { args: s.done(), expected: [null, null, null, null, null, [30, 20, 10]], note: 'All three tweets share timestamp 7, so the one posted last is the most recent.' };
  })(),
  (() => {
    const s = script();
    for (let k = 1; k <= 12; k++) s.post(1, k, k);
    s.feed(1);
    return { args: s.done(), expected: [null, ...Array(12).fill(null), [12, 11, 10, 9, 8, 7, 6, 5, 4, 3]], note: 'A feed holds at most 10 tweets: the 10 most recent.' };
  })(),
  (() => {
    const s = script();
    s.follow(1, 1);
    s.follow(1, 2);
    s.follow(1, 2);
    s.post(2, 9, 1);
    s.post(1, 8, 2);
    s.unfollow(1, 1);
    s.feed(1);
    return { args: s.done(), expected: [null, null, null, null, null, null, null, [8, 9]], note: 'Following yourself or following twice changes nothing, and you cannot unfollow yourself.' };
  })(),
  (() => {
    const s = script();
    s.feed(99);
    s.follow(3, 4);
    s.feed(3);
    return { args: s.done(), expected: [null, [], null, []], note: 'A user with nothing to show gets an empty feed.' };
  })(),
];

// Hidden tests: one author past the feed size; follows, unfollows, a re-follow, and a self-unfollow;
// bursts of equal timestamps; two seeded random sessions on 8 and 60 users; and five of 10^5 calls:
// a user following 150 others who hold 50,000 tweets between them (about 49,800 feeds, so collecting
// every tweet per feed is far too slow), one author with 50,000 tweets and 49,999 feeds, a random
// mix on 3000 users, a random mix on 10 users who follow each other heavily, and bursts of 500
// equal timestamps.
const hiddenArgs = [
  (() => {
    const s = script();
    for (let k = 0; k < 15; k++) s.post(3, tweetIdOf(k), 1 + (k >> 2));
    s.feed(3);
    s.feed(4);
    return s.done();
  })(),
  (() => {
    const s = script();
    s.post(1, 11, 1);
    s.post(2, 12, 2);
    s.post(3, 13, 3);
    s.follow(1, 2);
    s.follow(1, 3);
    s.feed(1);
    s.unfollow(1, 2);
    s.feed(1);
    s.post(2, 14, 4);
    s.feed(1);
    s.follow(1, 2);
    s.feed(1);
    s.unfollow(1, 1);
    s.unfollow(1, 9);
    s.feed(1);
    s.feed(2);
    s.unfollow(1, 2);
    s.unfollow(1, 3);
    s.feed(1);
    return s.done();
  })(),
  equalTimestampBursts(60, 6),
  randomSession(71, 8, 400),
  randomSession(72, 60, 6000),
  fanIn(73, 150, 50000),
  singleAuthor(50000, 49999),
  randomSession(75, 3000, MAX_CALLS),
  randomSession(76, 10, MAX_CALLS, { post: 0.3, feed: 0.4 }),
  equalTimestampBursts(MAX_CALLS, 500),
];

export const problem = {
  id: 'mini-feed',
  title: 'Mini Feed',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Design', 'K-way Merge', 'Heap'],
  timeLimitMs: 4000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Design a tiny social feed. Users are identified by integers. Implement the class
    <code>MiniFeed</code>:</p>
    <ul>
      <li><code>MiniFeed()</code> creates an empty feed service.</li>
      <li><code>post(userId, tweetId, time)</code> makes <code>userId</code> post the tweet
      <code>tweetId</code> at timestamp <code>time</code>. Every <code>tweetId</code> is posted once.</li>
      <li><code>getFeed(userId)</code> returns the ids of the <code>10</code> most recent tweets posted by
      <code>userId</code> or by any user <code>userId</code> follows <em>right now</em>, most recent
      first. If there are fewer than 10, it returns all of them.</li>
      <li><code>follow(followerId, followeeId)</code> makes <code>followerId</code> follow
      <code>followeeId</code>. Following someone already followed, or yourself, changes nothing.</li>
      <li><code>unfollow(followerId, followeeId)</code> makes <code>followerId</code> stop following
      <code>followeeId</code>. It changes nothing if they were not following, and nobody can unfollow
      themselves: your own tweets are always in your feed.</li>
    </ul>
    <p><strong>Recency.</strong> A tweet with a larger timestamp is more recent. Between tweets with the
    same timestamp, the one posted by the later call is more recent. Timestamps never decrease from one
    <code>post</code> call to the next.</p>
    <p>A test is a sequence of calls: the first list names the operations, the second gives each call's
    arguments, and the output lists each call's result (<code>null</code> for the constructor and for
    <code>post</code>, <code>follow</code> and <code>unfollow</code>).</p>
  `,
  constraints: [
    '1 <= userId, followerId, followeeId <= 10^5',
    '1 <= tweetId <= 10^9, all distinct; 0 <= time <= 10^9, never decreasing across post calls',
    'A user follows at most 1000 other users at any moment',
    'At most 10^5 calls in total, including the constructor',
    'Target complexity: O(F + 10 log F) per getFeed for F followed users, O(1) per other call',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If a user follows 1000 people with 50,000 tweets between them, what does it cost to gather every tweet and sort them for each feed? How many tweets can a feed even use?',
    'Each user\'s own tweets arrive in order. What structure per user lets you reach their newest tweet first and then the next newest?',
    'You need the 10 newest tweets across several already sorted lists. Which structure always hands you the largest of several candidates?',
    'When you take a tweet from one user\'s list, what is the only new candidate you have to consider?',
    'Two tweets share a timestamp. What decides which one comes first, and what single number per tweet can encode that rule?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Keep each user's tweets in posting order, newest at the end (or as a linked list from the newest).
    Give every tweet a global sequence number, the count of posts so far. A feed is then a merge of
    already sorted lists: put the newest tweet of the user and of each followee into a max-heap keyed by
    the sequence number, pop the largest, record its id, and push the next older tweet of the same
    author. Stop after 10 pops or when the heap is empty.</p>
    <h4>Why it works</h4>
    <p>The heap always holds the newest tweet not yet used from every author, so its top is the newest
    tweet left in the whole feed. After taking it, the only tweet that can become the new top candidate
    from that author is their next older one. Timestamps never decrease, so a larger sequence number
    means a larger timestamp, and equal timestamps are ordered by the later call exactly as the
    statement asks.</p>
    <h4>Complexity</h4>
    <p><code>post</code>, <code>follow</code> and <code>unfollow</code> are O(1) with hash sets and
    lists. <code>getFeed</code> builds a heap of at most F + 1 entries and pops at most 10 times: O(F + 10
    log F), independent of how many tweets exist.</p>
    <h4>Pitfall</h4>
    <p>Gathering and sorting every followee tweet is correct but O(total tweets) per feed, about
    2.5 * 10^9 steps on the max test. Comparing timestamps only leaves equal ones in arbitrary order.
    Self-follows must not show your tweets twice or let you unfollow yourself, and tweets of an
    unfollowed user must disappear.</p>
  `,

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'MiniFeed',
    constructor: { params: [] },
    methods: [
      {
        name: 'post',
        params: [
          { name: 'userId', type: 'int' },
          { name: 'tweetId', type: 'int' },
          { name: 'time', type: 'int' },
        ],
        returns: 'void',
      },
      { name: 'getFeed', params: [{ name: 'userId', type: 'int' }], returns: 'int[]' },
      {
        name: 'follow',
        params: [
          { name: 'followerId', type: 'int' },
          { name: 'followeeId', type: 'int' },
        ],
        returns: 'void',
      },
      {
        name: 'unfollow',
        params: [
          { name: 'followerId', type: 'int' },
          { name: 'followeeId', type: 'int' },
        ],
        returns: 'void',
      },
    ],
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two JSON lines, the operations and then the argument lists.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: the operations, then the argument lists (both JSON arrays).' };
    let ops;
    let args;
    try {
      ops = JSON.parse(lines[0]);
      args = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON arrays.' };
    }
    if (!Array.isArray(ops) || !Array.isArray(args) || ops.length !== args.length) return { ok: false, error: 'Operations and arguments must be arrays of the same length.' };
    if (ops.length < 1 || ops.length > MAX_CALLS) return { ok: false, error: 'Between 1 and 10^5 calls.' };
    if (ops[0] !== 'MiniFeed' || !Array.isArray(args[0]) || args[0].length !== 0) return { ok: false, error: 'The first call must be "MiniFeed" with no arguments ([]).' };
    const arity = { post: 3, getFeed: 1, follow: 2, unfollow: 2 };
    const isUser = (v) => Number.isInteger(v) && v >= 1 && v <= MAX_USER;
    const seen = new Set();
    const following = new Map();
    let lastTime = 0;
    for (let i = 1; i < ops.length; i++) {
      const op = ops[i];
      const a = args[i];
      if (!(op in arity)) return { ok: false, error: `Unknown operation "${op}" (call ${i}).` };
      if (!Array.isArray(a) || a.length !== arity[op] || !a.every(Number.isInteger)) return { ok: false, error: `${op} needs ${arity[op]} integer argument(s) (call ${i}).` };
      if (op === 'post') {
        if (!isUser(a[0])) return { ok: false, error: `userId must be from 1 to 10^5 (call ${i}).` };
        if (a[1] < 1 || a[1] > MAX_VAL) return { ok: false, error: `tweetId must be from 1 to 10^9 (call ${i}).` };
        if (seen.has(a[1])) return { ok: false, error: `tweetId ${a[1]} is posted twice (call ${i}).` };
        seen.add(a[1]);
        if (a[2] < 0 || a[2] > MAX_VAL) return { ok: false, error: `time must be from 0 to 10^9 (call ${i}).` };
        if (a[2] < lastTime) return { ok: false, error: `time must not decrease between post calls (call ${i}).` };
        lastTime = a[2];
      } else if (!a.every(isUser)) {
        return { ok: false, error: `User ids must be from 1 to 10^5 (call ${i}).` };
      } else if (op === 'follow' && a[0] !== a[1]) {
        if (!following.has(a[0])) following.set(a[0], new Set());
        following.get(a[0]).add(a[1]);
        if (following.get(a[0]).size > MAX_FOLLOWING) return { ok: false, error: `A user may follow at most 1000 users (call ${i}).` };
      } else if (op === 'unfollow') {
        following.get(a[0])?.delete(a[1]);
      }
    }
    return { ok: true, args: [ops, args] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). One reader follows 50 users who
  // post in turn; the session alternates a post and a feed, so the tweet count grows with n and a feed
  // that gathers every tweet would grow with it, while the merge costs about 50 per call.
  growth: {
    target: 'n',
    n: 'number of calls (a reader following 50 users, one post then one feed)',
    sizes: [16000, 32000, 64000, 128000, 256000, 512000, 1024000],
    input: (n) => {
      const ops = ['MiniFeed'];
      const args = [[]];
      for (let u = 2; u <= 51; u++) {
        ops.push('follow');
        args.push([1, u]);
      }
      for (let k = 0; ops.length < n; k++) {
        ops.push('post');
        args.push([2 + (k % 50), 1 + k, 1 + (k >> 1)]);
        if (ops.length < n) {
          ops.push('getFeed');
          args.push([1]);
        }
      }
      return [ops, args];
    },
  },
};

export default problem;
