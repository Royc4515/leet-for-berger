// The source adapters for the input types beyond ListNode and TreeNode, run the way the browser
// workers run them: adapter before, user code, adapter after. Python runs only where python3 exists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { adapterFor, needsAdapter, COPY_MARKERS } from '../src/js/engine/adapters.js';

const hasPython = !spawnSync('python3', ['--version']).error;

/** Same construction as engine/workers/js-worker.js. */
function runJs(sig, code, cases) {
  const ad = adapterFor('javascript', sig);
  const fn = new Function(`${ad.before}${code}${ad.after}\nreturn ${ad.entry};`)();
  return cases.map((args) => fn(...structuredClone(args)));
}

/** Same three exec steps as engine/workers/py-worker.js. */
function runPy(sig, code, cases) {
  const ad = adapterFor('python', sig);
  const main = `import json, sys
ns = {}
for part in (${JSON.stringify(ad.before)}, ${JSON.stringify(code)}, ${JSON.stringify(ad.after)}):
    exec(part, ns)
for args in json.loads(sys.stdin.read()):
    print(json.dumps(ns[${JSON.stringify(ad.entry)}](*args)))
`;
  const r = spawnSync('python3', ['-I', '-c', main], { input: JSON.stringify(cases), encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim().split('\n').map((l) => JSON.parse(l));
}

const cycleSig = { name: 'hasCycle', params: [{ name: 'head', type: 'ListNode@cycle' }], returns: 'bool' };
const copySig = { name: 'copyRandomList', params: [{ name: 'head', type: 'RandomListNode' }], returns: 'RandomListNode' };
const iterSig = {
  kind: 'class',
  name: 'NestedIterator',
  constructor: { params: [{ name: 'nestedList', type: 'NestedInteger[]' }] },
  methods: [
    { name: 'next', params: [], returns: 'int' },
    { name: 'hasNext', params: [], returns: 'bool' },
  ],
};

test('every new type needs an adapter; only the types in use are emitted', () => {
  for (const sig of [cycleSig, copySig, iterSig]) assert.ok(needsAdapter(sig));
  assert.ok(!adapterFor('javascript', cycleSig).before.includes('RandomListNode'));
  assert.ok(!adapterFor('python', copySig).before.includes('NestedInteger'));
  const plain = adapterFor('javascript', { name: 'reverseList', params: [{ name: 'head', type: 'ListNode' }], returns: 'ListNode' });
  assert.ok(!plain.before.includes('__lfb_toCycleList') && !plain.before.includes('RandomListNode') && !plain.before.includes('NestedInteger'));
});

// Counts nodes until a revisit; the user's function gets only the head, never pos.
const jsCycleCount = `function hasCycle(head) {
  if (arguments.length !== 1) throw new Error('pos leaked');
  const seen = new Set();
  for (let n = head; n; n = n.next) { if (seen.has(n)) return seen.size; seen.add(n); }
  return false;
}`;
const pyCycleCount = `def has_cycle(head):
    seen = set()
    while head is not None:
        if head in seen:
            return len(seen)
        seen.add(head)
        head = head.next
    return False
`;
const cycleCases = [[[[3, 2, 0, -4], 1]], [[[1], -1]], [[[], -1]], [[[5], 0]], [[[1, 1, 1], 2]]];

test('ListNode@cycle builds the tail link at pos (JavaScript)', () => {
  assert.deepEqual(runJs(cycleSig, jsCycleCount, cycleCases), [4, false, false, 1, 3]);
});

test('ListNode@cycle builds the tail link at pos (Python)', { skip: !hasPython && 'python3 not installed' }, () => {
  assert.deepEqual(runPy(cycleSig, pyCycleCount, cycleCases), [4, false, false, 1, 3]);
});

const copyCases = [[[[3, null], [8, 0], [5, 4], [2, 2], [9, 0]]], [[]], [[[1, 0]]]];
const copyExpected = [[[3, null], [8, 0], [5, 4], [2, 2], [9, 0]], [], [[1, 0]]];

const jsCopies = {
  correct: `function copyRandomList(head) {
  const m = new Map([[null, null]]);
  for (let n = head; n; n = n.next) m.set(n, new RandomListNode(n.val));
  for (let n = head; n; n = n.next) { m.get(n).next = m.get(n.next); m.get(n).random = m.get(n.random); }
  return m.get(head);
}`,
  original: 'function copyRandomList(head) { return head; }',
  // Copies next pointers but leaves random pointing into the original list.
  halfCopy: `function copyRandomList(head) {
  const d = new RandomListNode(); let t = d;
  for (let n = head; n; n = n.next) { t.next = new RandomListNode(n.val, null, n.random); t = t.next; }
  return d.next;
}`,
  // Random points at a fresh node that is not part of the returned list.
  stray: `function copyRandomList(head) {
  const d = new RandomListNode(); let t = d;
  for (let n = head; n; n = n.next) { t.next = new RandomListNode(n.val, null, n.random ? new RandomListNode(0) : null); t = t.next; }
  return d.next;
}`,
};

test('RandomListNode round-trips a real copy and flags anything else (JavaScript)', () => {
  assert.deepEqual(runJs(copySig, jsCopies.correct, copyCases), copyExpected);
  assert.deepEqual(runJs(copySig, jsCopies.original, copyCases), [COPY_MARKERS.sharedNode, [], COPY_MARKERS.sharedNode]);
  assert.deepEqual(runJs(copySig, jsCopies.halfCopy, copyCases), [COPY_MARKERS.sharedNode, [], COPY_MARKERS.sharedNode]);
  assert.deepEqual(runJs(copySig, jsCopies.stray, copyCases), [COPY_MARKERS.outsideRandom, [], COPY_MARKERS.outsideRandom]);
});

const pyCopies = {
  correct: `def copy_random_list(head):
    m = {None: None}
    n = head
    while n:
        m[n] = RandomListNode(n.val)
        n = n.next
    n = head
    while n:
        m[n].next = m[n.next]
        m[n].random = m[n.random]
        n = n.next
    return m[head]
`,
  original: 'def copy_random_list(head):\n    return head\n',
  stray: `def copy_random_list(head):
    d = t = RandomListNode()
    n = head
    while n:
        t.next = RandomListNode(n.val, None, RandomListNode(0) if n.random else None)
        t = t.next
        n = n.next
    return d.next
`,
};

test('RandomListNode round-trips a real copy and flags anything else (Python)', { skip: !hasPython && 'python3 not installed' }, () => {
  assert.deepEqual(runPy(copySig, pyCopies.correct, copyCases), copyExpected);
  assert.deepEqual(runPy(copySig, pyCopies.original, copyCases), [COPY_MARKERS.sharedNode, [], COPY_MARKERS.sharedNode]);
  assert.deepEqual(runPy(copySig, pyCopies.stray, copyCases), [COPY_MARKERS.outsideRandom, [], COPY_MARKERS.outsideRandom]);
});

// A deliberately eager iterator: the adapter's job is the NestedInteger interface, not the algorithm.
const jsIter = `class NestedIterator {
  constructor(list) {
    this.out = [];
    const walk = (l) => l.forEach((x) => (x.isInteger() ? this.out.push(x.getInteger()) : walk(x.getList())));
    walk(list);
    this.i = 0;
  }
  next() { return this.out[this.i++]; }
  hasNext() { return this.i < this.out.length; }
}`;
const pyIter = `class NestedIterator:
    def __init__(self, nested_list):
        self.out = []
        def walk(l):
            for x in l:
                # snake_case and LeetCode's camelCase both work
                if x.is_integer():
                    self.out.append(x.getInteger())
                else:
                    walk(x.get_list())
        walk(nested_list)
        self.i = 0

    def next(self):
        self.i += 1
        return self.out[self.i - 1]

    def has_next(self):
        return self.i < len(self.out)
`;
const iterCases = [
  [['NestedIterator', 'hasNext', 'next', 'next', 'next', 'hasNext'], [[[[1, [2]], [], 3]], [], [], [], [], []]],
  [['NestedIterator', 'hasNext'], [[[[], [[]]]], []]],
];
const iterExpected = [[null, true, 1, 2, 3, false], [null, false]];

test('NestedInteger[] exposes the LeetCode interface (JavaScript)', () => {
  assert.deepEqual(runJs(iterSig, jsIter, iterCases), iterExpected);
  // The value is private: user code reaches it only through the accessors.
  const peek = runJs(iterSig, 'class NestedIterator { constructor(l) { this.k = Object.keys(l[0]).length; } next() { return this.k; } hasNext() { return true; } }', [
    [['NestedIterator', 'next'], [[[1]], []]],
  ]);
  assert.deepEqual(peek, [[null, 0]]);
});

test('NestedInteger[] exposes the LeetCode interface (Python)', { skip: !hasPython && 'python3 not installed' }, () => {
  assert.deepEqual(runPy(iterSig, pyIter, iterCases), iterExpected);
});

// Growth timing (ADR 0004) converts input before the clock: __lfb_prepare builds the objects,
// __lfb_call runs only the user's function on them.
const sumTreeSig = { name: 'sumTree', params: [{ name: 'root', type: 'TreeNode' }, { name: 'k', type: 'int' }], returns: 'int' };

test('growth split: prepare builds the objects, call runs only the user code (JavaScript)', () => {
  const ad = adapterFor('javascript', sumTreeSig);
  assert.deepEqual(ad.growth, { prepare: '__lfb_prepare', call: '__lfb_call' });
  const code = 'function sumTree(root, k) { return root ? root.val * k + sumTree(root.left, k) + sumTree(root.right, k) : 0; }';
  const [prepare, call] = new Function(`${ad.before}${code}${ad.after}\nreturn [${ad.growth.prepare}, ${ad.growth.call}];`)();
  const prepared = prepare([1, 2, 3, null, 4], 2);
  assert.equal(prepared[0].left.right.val, 4);
  assert.equal(call(prepared), 20);
  // Design classes and TypeScript time the whole entry: no split.
  assert.equal(adapterFor('javascript', { kind: 'class', name: 'C', constructor: { params: [] }, methods: [] }).growth, undefined);
  assert.equal(adapterFor('typescript', sumTreeSig).growth, undefined);
});

test('growth split: prepare builds the objects, call runs only the user code (Python)', { skip: !hasPython && 'python3 not installed' }, () => {
  const ad = adapterFor('python', sumTreeSig);
  assert.deepEqual(ad.growth, { prepare: '__lfb_prepare', call: '__lfb_call' });
  const code = 'def sum_tree(root, k):\n    return root.val * k + sum_tree(root.left, k) + sum_tree(root.right, k) if root else 0\n';
  const main = `ns = {}
for part in (${JSON.stringify(ad.before)}, ${JSON.stringify(code)}, ${JSON.stringify(ad.after)}):
    exec(part, ns)
p = ns['__lfb_prepare']([1, 2, 3, None, 4], 2)
print(p[0].left.right.val, ns['__lfb_call'](p))
`;
  const r = spawnSync('python3', ['-I', '-c', main], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), '4 20');
});
