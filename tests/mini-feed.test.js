import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/mini-feed/problem.js';

/**
 * Naive simulation: keep every tweet with its timestamp and posting order, and for each feed gather
 * all tweets of the user and the followees and sort them. Independent of the heap and of sequence
 * numbers. `opts` switches on the classic mistakes.
 */
function simulate(ops, args, opts = {}) {
  const tweets = [];
  const follows = new Map();
  const hidden = new Set(); // users who "unfollowed themselves" (a wrong rule)
  const tie = {
    later: (a, b) => b.order - a.order,
    tweetIdAsc: (a, b) => a.id - b.id,
    userAsc: (a, b) => a.user - b.user,
  }[opts.tie ?? 'later'];
  return ops.map((op, i) => {
    if (op === 'post') {
      const [user, id, time] = args[i];
      tweets.push({ user, id, time, order: tweets.length });
      return null;
    }
    if (op === 'follow') {
      const [a, b] = args[i];
      if (a !== b || opts.selfInSet) {
        if (!follows.has(a)) follows.set(a, new Set());
        follows.get(a).add(b);
      }
      return null;
    }
    if (op === 'unfollow') {
      const [a, b] = args[i];
      if (a === b && opts.selfRemovable) hidden.add(a);
      else if (!opts.keepAfterUnfollow) follows.get(a)?.delete(b);
      return null;
    }
    if (op !== 'getFeed') return null;
    const user = args[i][0];
    const authors = [...(hidden.has(user) ? [] : [user]), ...(follows.get(user) ?? [])];
    // With selfInSet the own tweets are gathered once for the user and once for the follow set.
    const pool = authors.flatMap((u) => tweets.filter((t) => t.user === u));
    return pool.sort((a, b) => b.time - a.time || tie(a, b)).slice(0, 10).map((t) => t.id);
  });
}

const brute = (ops, args) => simulate(ops, args);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function randomCase(rnd) {
  const users = 1 + Math.floor(rnd() * 5);
  const calls = 2 + Math.floor(rnd() * 40);
  const ops = ['MiniFeed'];
  const args = [[]];
  let time = Math.floor(rnd() * 3);
  let id = 0;
  while (ops.length < calls) {
    const r = rnd();
    const u = 1 + Math.floor(rnd() * users);
    const v = 1 + Math.floor(rnd() * users);
    if (r < 0.4) {
      if (rnd() < 0.4) time++;
      ops.push('post');
      args.push([u, ++id * 13, time]);
    } else if (r < 0.65) {
      ops.push('getFeed');
      args.push([u]);
    } else if (r < 0.85) {
      ops.push('follow');
      args.push([u, v]);
    } else {
      ops.push('unfollow');
      args.push([u, v]);
    }
  }
  return [ops, args];
}

test('reference matches the naive simulation on 3000 seeded sessions', () => {
  const rnd = mulberry32(355);
  let longFeeds = 0;
  let feeds = 0;
  for (let i = 0; i < 3000; i++) {
    const [ops, args] = randomCase(rnd);
    const expected = brute(ops, args);
    assert.deepEqual(reference(ops, args), expected, JSON.stringify([ops, args]));
    for (const e of expected) if (Array.isArray(e)) feeds += 1, longFeeds += e.length >= 3 ? 1 : 0;
  }
  assert.ok(longFeeds > 1000, `only ${longFeeds} of ${feeds} feeds had 3 or more tweets`);
});

test('reference matches the naive simulation on 30 seeded longer sessions with feeds past 10', () => {
  const rnd = mulberry32(356);
  let full = 0;
  for (let i = 0; i < 30; i++) {
    const ops = ['MiniFeed'];
    const args = [[]];
    let time = 1;
    for (let k = 0; k < 400; k++) {
      const r = rnd();
      const u = 1 + Math.floor(rnd() * 4);
      if (r < 0.55) {
        if (rnd() < 0.5) time++;
        ops.push('post');
        args.push([u, k + 1, time]);
      } else if (r < 0.8) {
        ops.push('getFeed');
        args.push([u]);
      } else {
        ops.push(rnd() < 0.7 ? 'follow' : 'unfollow');
        args.push([u, 1 + Math.floor(rnd() * 4)]);
      }
    }
    const expected = brute(ops, args);
    assert.deepEqual(reference(ops, args), expected);
    full += expected.filter((e) => Array.isArray(e) && e.length === 10).length;
  }
  assert.ok(full > 200, `only ${full} full feeds`);
});

test('visible expectations agree with the reference and the naive simulation', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.deepEqual(reference(...t.args), t.expected);
    assert.deepEqual(brute(...t.args), t.expected);
  }
});

test('the naive simulation agrees on the hidden tests that are small enough', () => {
  for (const t of problem.hiddenTests.filter((h) => h.args[0].length <= 6000)) assert.deepEqual(brute(...t.args), t.expected);
});

test('every test is a legal session; at least two tests use 10^5 calls', () => {
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const raw = `${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`;
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 80));
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 4);
});

test('hidden tests catch the classic wrong answers', () => {
  const wrongs = {
    'ties broken by tweet id': { tie: 'tweetIdAsc' },
    'ties broken by author': { tie: 'userAsc' },
    'self-follow adds the author twice': { selfInSet: true },
    'a user can unfollow themselves': { selfRemovable: true },
    'unfollow keeps the tweets': { keepAfterUnfollow: true },
  };
  for (const [name, opts] of Object.entries(wrongs)) {
    const failsHidden = problem.hiddenTests.some((t) => t.args[0].length <= 6000 && !same(simulate(...t.args, opts), t.expected));
    assert.ok(failsHidden, `${name} passes every hidden test`);
  }
  // The equal-timestamp rule is shown by a visible case, so the first Run already catches it.
  assert.ok(problem.visibleTests.some((t) => !same(simulate(...t.args, { tie: 'userAsc' }), t.expected) || !same(simulate(...t.args, { tie: 'tweetIdAsc' }), t.expected)));
});

test('gathering every tweet per feed would cost billions of steps on a max test', () => {
  // Cost of one feed in the naive approach: every tweet posted so far by the user and the followees.
  const cost = (t) => {
    const [ops, args] = t.args;
    const follows = new Map();
    const tweetCount = new Map();
    let total = 0;
    ops.forEach((op, i) => {
      if (op === 'post') tweetCount.set(args[i][0], (tweetCount.get(args[i][0]) ?? 0) + 1);
      else if (op === 'follow' && args[i][0] !== args[i][1]) follows.set(args[i][0], (follows.get(args[i][0]) ?? new Set()).add(args[i][1]));
      else if (op === 'unfollow') follows.get(args[i][0])?.delete(args[i][1]);
      else if (op === 'getFeed') {
        total += tweetCount.get(args[i][0]) ?? 0;
        for (const u of follows.get(args[i][0]) ?? []) total += tweetCount.get(u) ?? 0;
      }
    });
    return total;
  };
  const heavy = problem.hiddenTests.filter((t) => cost(t) > 1e9);
  assert.ok(heavy.length >= 2, `only ${heavy.length} tests cost more than 1e9 steps`);
});

test('equal timestamps occur in the hidden tests, in bursts', () => {
  for (const t of problem.hiddenTests.slice(2, 3).concat(problem.hiddenTests.slice(-1))) {
    const times = t.args[1].filter((_, i) => t.args[0][i] === 'post').map((a) => a[2]);
    const shared = times.filter((v, i) => i > 0 && v === times[i - 1]).length;
    assert.ok(shared > times.length / 2, 'most posts share a timestamp with the previous one');
  }
});

test('custom input parser rejects illegal sessions', () => {
  const ok = '["MiniFeed","post","getFeed"]\n[[],[1,5,3],[1]]';
  assert.equal(problem.parseCustomInput(ok).ok, true);
  assert.equal(problem.parseCustomInput('["post"]\n[[1,5,3]]').ok, false);
  assert.equal(problem.parseCustomInput('["MiniFeed","post"]\n[[],[1,5]]').ok, false);
  assert.equal(problem.parseCustomInput('["MiniFeed","post"]\n[[],[0,5,3]]').ok, false);
  assert.equal(problem.parseCustomInput('["MiniFeed","post"]\n[[],[1,0,3]]').ok, false);
  assert.equal(problem.parseCustomInput('["MiniFeed","post"]\n[[],[1,5,-1]]').ok, false);
  assert.equal(problem.parseCustomInput('["MiniFeed","post","post"]\n[[],[1,5,3],[2,5,4]]').ok, false);
  assert.equal(problem.parseCustomInput('["MiniFeed","post","post"]\n[[],[1,5,3],[2,6,2]]').ok, false);
  assert.equal(problem.parseCustomInput('["MiniFeed","getFeed"]\n[[],[100001]]').ok, false);
  assert.equal(problem.parseCustomInput('["MiniFeed","follow"]\n[[],[1]]').ok, false);
  assert.equal(problem.parseCustomInput('["MiniFeed","tweet"]\n[[],[1]]').ok, false);
  const tooMany = ['MiniFeed', ...Array.from({ length: 1001 }, () => 'follow')];
  const tooManyArgs = [[], ...Array.from({ length: 1001 }, (_, i) => [1, i + 2])];
  assert.equal(problem.parseCustomInput(`${JSON.stringify(tooMany)}\n${JSON.stringify(tooManyArgs)}`).ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});
