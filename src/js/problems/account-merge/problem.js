/**
 * Problem: Account Merge
 *
 * Accounts that share an email belong to the same person, transitively. Union-find over account
 * indexes, joining each account to the first account seen with each of its emails, groups them in
 * O(total emails * alpha) plus the sorting of the output.
 *
 * LeetCode accepts any order; here the order is fixed so judging is exact: emails sorted, then
 * accounts sorted by name and then by first email, all by character code. That is the default
 * string order in Python, JavaScript, Java, C++, Go and C (strcmp), but NOT in C#, where the
 * default comparison is culture-aware: C# needs StringComparer.Ordinal. A hidden test uses names
 * whose ordinal and culture orders differ ("McDonald" before "Mcafee").
 *
 * The account limit is raised from LeetCode's 1000 to 10^4, so repeatedly merging pairs of
 * accounts until nothing changes (quadratic or worse) times out.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_ACCOUNTS = 10000;
const MAX_LEN = 10;

/** Character-code order, the comparison the statement specifies. */
const byCode = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Reference: union-find on account indexes keyed by email, then grouping and sorting.
 * @param {string[][]} accounts
 * @returns {string[][]}
 */
export function reference(accounts) {
  const parent = accounts.map((_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const owner = new Map();
  accounts.forEach((acc, i) => {
    for (let j = 1; j < acc.length; j++) {
      const email = acc[j];
      if (owner.has(email)) parent[find(i)] = find(owner.get(email));
      else owner.set(email, i);
    }
  });
  const groups = new Map();
  for (const [email, i] of owner) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(email);
  }
  const out = [...groups].map(([root, emails]) => [accounts[root][0], ...emails.sort(byCode)]);
  return out.sort((a, b) => byCode(a[0], b[0]) || byCode(a[1], b[1]));
}

const NAMES = ['Alex', 'Bea', 'Chen', 'Dara', 'Eli', 'Fatima', 'Goran', 'Hana', 'Ivo', 'Jun', 'Kofi', 'Lena', 'Mira', 'Noor', 'Omar', 'Pia'];

/** Fisher-Yates shuffle with a seeded generator. */
function shuffle(arr, rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * `people` hidden people, each with a private email pool; `count` accounts each draw 1 to 9
 * emails from one person's pool, so accounts of one person often, but not always, overlap.
 * Names repeat across people, so name alone never decides a merge.
 */
function randomCase(seed, count, people, poolSize) {
  const rnd = mulberry32(seed);
  const personName = Array.from({ length: people }, () => NAMES[Math.floor(rnd() * NAMES.length)]);
  const accounts = [];
  for (let i = 0; i < count; i++) {
    const person = Math.floor(rnd() * people);
    const k = 1 + Math.floor(rnd() * (MAX_LEN - 1));
    const emails = Array.from({ length: k }, () => `u${person}.${Math.floor(rnd() * poolSize)}@mail.com`);
    accounts.push([personName[person], ...emails]);
  }
  return shuffle(accounts, rnd);
}

/** count accounts of one person, account i sharing one email with account i + 1, shuffled. */
function longChain(seed, count) {
  const rnd = mulberry32(seed);
  const accounts = [];
  for (let i = 0; i < count; i++) {
    const own = Array.from({ length: 7 }, (_, k) => `c${i}x${k}@chain.org`);
    accounts.push(['Zed', `link${i}@chain.org`, ...own, `link${i + 1}@chain.org`]);
  }
  return shuffle(accounts, rnd);
}

const visible = [
  {
    args: [[['John', 'johnsmith@mail.com', 'john_newyork@mail.com'], ['John', 'johnsmith@mail.com', 'john00@mail.com'], ['Mary', 'mary@mail.com'], ['John', 'johnnybravo@mail.com']]],
    expected: [['John', 'john00@mail.com', 'john_newyork@mail.com', 'johnsmith@mail.com'], ['John', 'johnnybravo@mail.com'], ['Mary', 'mary@mail.com']],
    note: 'The first two accounts share johnsmith@mail.com. The other John shares nothing, so he stays separate.',
  },
  {
    args: [[['Gabe', 'gabe0@m.co', 'gabe3@m.co', 'gabe1@m.co'], ['Kevin', 'kevin3@m.co', 'kevin5@m.co', 'kevin0@m.co'], ['Ethan', 'ethan5@m.co', 'ethan4@m.co', 'ethan0@m.co']]],
    expected: [['Ethan', 'ethan0@m.co', 'ethan4@m.co', 'ethan5@m.co'], ['Gabe', 'gabe0@m.co', 'gabe1@m.co', 'gabe3@m.co'], ['Kevin', 'kevin0@m.co', 'kevin3@m.co', 'kevin5@m.co']],
    note: 'Nothing to merge; emails and accounts are still sorted.',
  },
  {
    args: [[['Ann', 'a@x.com', 'b@x.com'], ['Ann', 'c@x.com', 'd@x.com'], ['Ann', 'b@x.com', 'c@x.com']]],
    expected: [['Ann', 'a@x.com', 'b@x.com', 'c@x.com', 'd@x.com']],
    note: 'The third account links the first two, so all three merge.',
  },
  {
    args: [[['Lee', 'z@x.com', 'z@x.com', 'a@x.com']]],
    expected: [['Lee', 'a@x.com', 'z@x.com']],
    note: 'An email listed twice appears once.',
  },
  {
    args: [[['Sam', 'sam9@x.com'], ['Sam', 'sam1@x.com'], ['Ada', 'ada@x.com']]],
    expected: [['Ada', 'ada@x.com'], ['Sam', 'sam1@x.com'], ['Sam', 'sam9@x.com']],
    note: 'Same name, no shared email: two people, ordered by their first email.',
  },
];

// Hidden tests: a single account, merges that only connect through a later account, names whose
// character-code order differs from dictionary order ("McDonald" < "Mcafee", digits and '.' and
// '_' inside emails), duplicates across merged accounts, a 10^4-account chain that becomes one
// account of about 80,000 emails, and random 10^4-account inputs where pairwise merging times out.
const hiddenArgs = [
  [[['Solo', 'solo@x.com']]],
  [[['Kim', 'k1@x.com', 'k2@x.com'], ['Kim', 'k3@x.com'], ['Kim', 'k4@x.com', 'k3@x.com'], ['Kim', 'k2@x.com', 'k4@x.com']]],
  [[['Mcafee', 'm@x.com'], ['McDonald', 'd@x.com'], ['Mc', 'z@x.com'], ['MCX', 'y@x.com']]],
  [[['Uma', 'u.b@x.com', 'u_a@x.com', 'u9@x.com', 'uA@x.com', 'u@x.com']]],
  [[['Rae', 'r1@x.com', 'r2@x.com'], ['Rae', 'r2@x.com', 'r1@x.com', 'r3@x.com'], ['Rae', 'r3@x.com', 'r3@x.com']]],
  [randomCase(5, 300, 60, 12)],
  [randomCase(7, 2000, 400, 20)],
  [longChain(11, MAX_ACCOUNTS)],
  [randomCase(13, MAX_ACCOUNTS, 1500, 25)],
  [randomCase(17, MAX_ACCOUNTS, 4000, 15)],
];

export const problem = {
  id: 'account-merge',
  title: 'Account Merge',
  difficulty: 'Medium',
  topics: ['graphs'],
  patterns: ['Union-Find', 'Hash Map', 'Sorting'],
  timeLimitMs: 4000,
  argNames: ['accounts'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Each entry of <code>accounts</code> is a list whose first element is a person's name and
    whose remaining elements are email addresses. Two accounts belong to the same person if they
    share at least one email, directly or through a chain of accounts that each share an email
    with the next. People with the same name are different people unless their accounts are
    connected that way. Accounts of one person always carry the same name.</p>
    <p>Merge the accounts of each person into one entry: the name, followed by every distinct
    email of that person in sorted order. Return the entries sorted by name, and entries with the
    same name by their first email.</p>
    <p>All comparisons are by character code (ASCII), the default string order in Python and
    JavaScript, so <code>"McDonald"</code> comes before <code>"Mcafee"</code>.</p>
  `,
  constraints: [
    '1 <= accounts.length <= 10^4 (raised from LeetCode\'s 1000)',
    '2 <= accounts[i].length <= 10',
    '1 <= accounts[i][j].length <= 30',
    'Names are English letters; emails use lowercase and uppercase letters, digits, \'.\', \'_\' and one \'@\'',
    'An account may list the same email more than once',
    'Order: emails ascending; entries by name, then by first email; character-code comparison',
    'Target complexity: O(E log E) for E emails in total (pairwise merging times out)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `accounts = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If accounts are nodes, what makes two of them connected? What are you really looking for?',
    'Comparing every pair of accounts is slow. For one email, which account do you need to remember?',
    'Which structure merges groups cheaply as you discover that two accounts belong together?',
    'Once the groups are known, how do you collect each group\'s emails without repeats, and in what order?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Accounts are nodes; sharing an email connects them. Use union-find over account indexes:
    remember the first account that listed each email, and union every later account with it. Then
    collect each group's emails, sort, and sort the entries.</p>
    <h4>Why it works</h4>
    <p>Two accounts that share an email are joined directly, and a chain of shared emails is joined
    step by step, so each union-find set is exactly one person. Iterating the email-to-owner map visits
    each distinct email once, which removes duplicates inside an account and across accounts. Names
    are never used to merge.</p>
    <h4>Complexity</h4>
    <p>O(E log E) for E emails in total: unions are nearly O(1) each, and sorting the emails and the
    entries dominates. O(E) space. Repeatedly merging pairs of accounts until nothing changes is
    quadratic or worse at 10^4 accounts.</p>
    <h4>Pitfall</h4>
    <p>Two people with the same name are different unless an email links them. The output order is by
    character code, so <code>"McDonald"</code> comes before <code>"Mcafee"</code>; a locale-aware
    comparison sorts them the other way.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'accountsMerge',
    params: [{ name: 'accounts', type: 'string[][]' }],
    returns: 'string[][]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: accounts as a JSON array of string arrays.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let accounts;
    try {
      accounts = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter accounts as a JSON array of lists, for example [["Ann","a@x.com"]].' };
    }
    if (!Array.isArray(accounts) || accounts.length < 1 || accounts.length > MAX_ACCOUNTS) return { ok: false, error: 'accounts must have 1 to 10^4 entries.' };
    const nameOf = new Map();
    for (const acc of accounts) {
      if (!Array.isArray(acc) || acc.length < 2 || acc.length > MAX_LEN) return { ok: false, error: 'Each account must be a name followed by 1 to 9 emails.' };
      if (typeof acc[0] !== 'string' || !/^[A-Za-z]{1,30}$/.test(acc[0])) return { ok: false, error: 'Names must be 1 to 30 English letters.' };
      for (const email of acc.slice(1)) {
        if (typeof email !== 'string' || email.length > 30 || !/^[A-Za-z0-9._]+@[A-Za-z0-9._]+$/.test(email)) return { ok: false, error: 'Emails must be up to 30 characters: letters, digits, \'.\', \'_\' and one \'@\'.' };
        if (nameOf.has(email) && nameOf.get(email) !== acc[0]) return { ok: false, error: 'Accounts that share an email must have the same name.' };
        nameOf.set(email, acc[0]);
      }
    }
    return { ok: true, args: [accounts] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
