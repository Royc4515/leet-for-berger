/**
 * Problem: Notify Recipients (original)
 *
 * Inspired by a task candidates report from monday.com interviews: users belong to groups,
 * and a notification targets a mix of user ids and group ids. Resolve it to the exact set of
 * users to notify.
 *
 * Every problem module exports the same shape (see docs/PROBLEM_FORMAT.md).
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference O(M + R + K log K) solution: index groups once, expand each requested group once.
 * M = total memberships, R = requests, K = recipients.
 * @param {number[][]} users each row is [userId, ...groupIds]
 * @param {string[]} requests each is "user:<id>" or "group:<id>"
 * @returns {number[]} distinct user ids, ascending
 */
export function reference(users, requests) {
  const known = new Set();
  const members = new Map();
  for (const [id, ...groups] of users) {
    known.add(id);
    for (const g of groups) {
      if (!members.has(g)) members.set(g, []);
      members.get(g).push(id);
    }
  }
  const out = new Set();
  const expanded = new Set();
  for (const r of requests) {
    const [kind, raw] = r.split(':');
    const id = Number(raw);
    if (kind === 'user') {
      if (known.has(id)) out.add(id);
    } else if (!expanded.has(id)) {
      // A group asked for twice must not be walked twice: that is the O(R * groupSize) trap.
      expanded.add(id);
      for (const u of members.get(id) ?? []) out.add(u);
    }
  }
  return [...out].sort((a, b) => a - b);
}

/** Deterministic generators: hidden tests must be identical on every run, or results flake. */
function randomCase(seed, nUsers, nGroups, maxGroupsPerUser, nRequests, groupShare) {
  const rnd = mulberry32(seed);
  const pick = (n) => Math.floor(rnd() * n);
  const users = [];
  for (let i = 0; i < nUsers; i++) {
    const row = [i * 7 + 3];
    const k = pick(maxGroupsPerUser + 1);
    const seen = new Set();
    for (let j = 0; j < k; j++) {
      const g = pick(nGroups) + 1;
      if (!seen.has(g)) {
        seen.add(g);
        row.push(g);
      }
    }
    users.push(row);
  }
  const requests = [];
  for (let i = 0; i < nRequests; i++) {
    if (rnd() < groupShare) requests.push(`group:${pick(nGroups + 5) + 1}`);
    else requests.push(`user:${pick(nUsers + 50) * 7 + 3}`);
  }
  return [users, requests];
}

const MAX_USERS = 100000;

/** Everyone in one group, and that group requested 10^5 times: punishes re-expanding a group. */
function oneHugeGroupRequestedOften() {
  const users = Array.from({ length: MAX_USERS }, (_, i) => [MAX_USERS - i, 1]);
  const requests = Array.from({ length: MAX_USERS }, () => 'group:1');
  return [users, requests];
}

/** 10^5 distinct tiny groups, each requested once: punishes scanning all users per group request. */
function manySmallGroups() {
  const users = Array.from({ length: MAX_USERS }, (_, i) => [i + 1, i + 1]);
  const requests = Array.from({ length: MAX_USERS }, (_, i) => `group:${i + 1}`);
  return [users, requests];
}

const visible = [
  {
    args: [[[1, 10], [2, 10], [3, 20]], ['group:10', 'user:3']],
    expected: [1, 2, 3],
    note: 'Group 10 brings users 1 and 2; user 3 is named directly.',
  },
  {
    args: [[[1, 10, 20], [2, 20], [3, 30]], ['group:10', 'group:20', 'user:1']],
    expected: [1, 2],
    note: 'User 1 is reached three ways but is notified once.',
  },
  {
    args: [[[5, 1], [7]], ['user:9', 'group:2', 'user:7']],
    expected: [7],
    note: 'Unknown users and empty groups are ignored.',
  },
  {
    args: [[[1, 1]], []],
    expected: [],
    note: 'No requests, nobody to notify.',
  },
  {
    args: [[[4], [2, 3], [9, 3, 4]], ['group:4', 'user:4', 'group:3']],
    expected: [2, 4, 9],
    note: 'User 4 is in no group but is named directly.',
  },
];

// Hidden tests target the classic wrong answers: duplicates, unknown ids, sorting ids as text,
// mixing up user and group namespaces, and inputs big enough to expose repeated scans.
const hiddenArgs = [
  [[[1]], ['user:1']],
  [[[1, 1], [2, 2]], ['user:3', 'group:3', 'group:0']],
  [[[3, 1], [1, 1], [2, 2]], ['group:1', 'group:1', 'user:3', 'user:3', 'group:2']],
  [[[1000000000, 1], [2, 1], [30, 1]], ['group:1']],
  [[[1, 2], [2, 1]], ['group:2']],
  randomCase(7, 2000, 50, 3, 500, 0.5),
  oneHugeGroupRequestedOften(),
  randomCase(11, MAX_USERS, 1000, 2, MAX_USERS, 0.5),
  manySmallGroups(),
  randomCase(13, 5000, 10, 10, 3000, 0.1),
];

export const problem = {
  id: 'notify-recipients',
  title: 'Notify Recipients',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Hash Map Index', 'Deduplication'],
  milestone: 1,
  timeLimitMs: 4000,
  argNames: ['users', 'requests'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A workspace has users, and each user belongs to zero or more groups. You are given
    <code>users</code>, where <code>users[i] = [userId, groupId1, groupId2, ...]</code> lists a
    user's id followed by the ids of the groups they belong to.</p>
    <p>A notification is sent to a list of <code>requests</code>. Each request is either
    <code>"user:&lt;id&gt;"</code>, meaning that one user, or <code>"group:&lt;id&gt;"</code>,
    meaning every member of that group.</p>
    <p>Return the ids of all users who should be notified, each id once, in ascending order.
    Requests for a user or group that does not exist are ignored. User ids and group ids are
    separate namespaces: <code>"user:2"</code> and <code>"group:2"</code> are unrelated.</p>
  `,
  constraints: [
    '1 <= users.length <= 10^5',
    'User ids are distinct, 1 <= id <= 10^9; group ids satisfy 1 <= id <= 10^9',
    'Each user is in at most 10 groups; total memberships <= 2 * 10^5',
    '0 <= requests.length <= 10^5',
    'Target complexity: O(M + R + K log K) for M memberships, R requests, K recipients',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `users = ${JSON.stringify(t.args[0])}, requests = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'For one "group" request, how many users does your code look at? What if there are 10^5 such requests?',
    'Could you find a group\'s members without scanning every user each time?',
    'What happens when the same group is requested twice, or a user is reached through two groups?',
    'How are you sorting the ids: as numbers or as text? Where would "30" and "1000000000" land?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'notifyRecipients',
    params: [
      { name: 'users', type: 'int[][]' },
      { name: 'requests', type: 'string[]' },
    ],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines of JSON, users then requests.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: users (JSON array), then requests (JSON array).' };
    let users;
    let requests;
    try {
      users = JSON.parse(lines[0]);
      requests = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON arrays.' };
    }
    if (!Array.isArray(users) || users.length < 1 || users.length > MAX_USERS) {
      return { ok: false, error: 'users must be an array of 1 to 10^5 rows.' };
    }
    const ids = new Set();
    for (const row of users) {
      if (!Array.isArray(row) || row.length < 1 || row.length > 11) return { ok: false, error: 'Each user row is [userId, ...up to 10 groupIds].' };
      if (!row.every((x) => Number.isInteger(x) && x >= 1 && x <= 1e9)) return { ok: false, error: 'Ids must be integers from 1 to 10^9.' };
      if (ids.has(row[0])) return { ok: false, error: `Duplicate user id ${row[0]}.` };
      ids.add(row[0]);
    }
    if (!Array.isArray(requests) || requests.length > MAX_USERS) return { ok: false, error: 'requests must be an array of at most 10^5 strings.' };
    if (!requests.every((r) => typeof r === 'string' && /^(user|group):[1-9]\d{0,9}$/.test(r))) {
      return { ok: false, error: 'Each request is "user:<id>" or "group:<id>".' };
    }
    return { ok: true, args: [users, requests] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
