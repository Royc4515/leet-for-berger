import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES, entryName, methodName, typeIn, parseType, validateSignature, starterCode } from '../src/js/engine/codegen.js';

const sig = { name: 'notifyRecipients', params: [{ name: 'users', type: 'int[][]' }, { name: 'requests', type: 'string[]' }], returns: 'int[]' };

test('eight languages, each with a solution file name', () => {
  assert.equal(LANGUAGES.length, 8);
  assert.deepEqual(new Set(LANGUAGES.map((l) => l.id)).size, 8);
  for (const l of LANGUAGES) assert.ok(l.file);
});

test('entry names follow each language convention', () => {
  assert.equal(entryName('python', 'notifyRecipients'), 'notify_recipients');
  assert.equal(entryName('python', 'topKFrequent'), 'top_k_frequent');
  assert.equal(entryName('python', 'lengthOfLIS'), 'length_of_lis');
  assert.equal(entryName('python', 'parseHTTPHeader'), 'parse_http_header');
  assert.equal(entryName('csharp', 'notifyRecipients'), 'NotifyRecipients');
  assert.equal(entryName('go', 'notifyRecipients'), 'notifyRecipients');
});

test('types map per language', () => {
  assert.equal(typeIn('python', 'int[][]'), 'list[list[int]]');
  assert.equal(typeIn('cpp', 'string[]'), 'vector<string>');
  assert.equal(typeIn('go', 'long[]'), '[]int64');
  assert.equal(typeIn('java', 'bool'), 'boolean');
  assert.equal(typeIn('csharp', 'int[][]'), 'int[][]');
});

test('parseType rejects unknown types and deep arrays', () => {
  assert.deepEqual(parseType('double[]'), { base: 'double', dims: 1, struct: false });
  assert.deepEqual(parseType('ListNode[]'), { base: 'ListNode', dims: 1, struct: true });
  assert.throws(() => parseType('TreeNode[]'));
  assert.throws(() => parseType('float'));
  assert.throws(() => parseType('int[][][]'));
});

test('validateSignature catches bad names and types', () => {
  assert.deepEqual(validateSignature(sig), []);
  const errors = validateSignature({ name: 'Bad', params: [{ name: 'x', type: 'float' }, { name: 'x', type: 'int' }], returns: 'void' });
  assert.ok(errors.some((e) => e.includes('camelCase')));
  assert.ok(errors.some((e) => e.includes('duplicate')));
  assert.ok(errors.some((e) => e.includes('float')));
  assert.ok(errors.some((e) => e.startsWith('returns')));
});

test('C starter uses LeetCode-style sizes and out-params', () => {
  const c = starterCode('c', sig);
  assert.ok(c.includes('int* notifyRecipients(int** users, int usersSize, int* usersColSize, char** requests, int requestsSize, int* returnSize)'));
  assert.ok(c.includes('*returnSize = 0;'));
});

test('every language gets starter code naming the entry', () => {
  for (const l of LANGUAGES) assert.ok(starterCode(l.id, sig).includes(entryName(l.id, sig.name)), l.id);
});

const minStack = {
  kind: 'class',
  name: 'MinStack',
  constructor: { params: [] },
  methods: [
    { name: 'push', params: [{ name: 'val', type: 'int' }], returns: 'void' },
    { name: 'getMin', params: [], returns: 'int' },
  ],
};

test('class signatures validate and reject bad shapes', () => {
  assert.deepEqual(validateSignature(minStack), []);
  const errors = validateSignature({ kind: 'class', name: 'bad', constructor: { params: [] }, methods: [] });
  assert.ok(errors.some((e) => e.includes('PascalCase')));
  assert.ok(errors.some((e) => e.includes('at least one method')));
});

test('method names follow each language convention', () => {
  assert.equal(methodName('python', 'MinStack', 'getMin'), 'get_min');
  assert.equal(methodName('go', 'MinStack', 'getMin'), 'GetMin');
  assert.equal(methodName('csharp', 'MinStack', 'getMin'), 'GetMin');
  assert.equal(methodName('c', 'MinStack', 'getMin'), 'minStackGetMin');
  assert.equal(methodName('java', 'MinStack', 'getMin'), 'getMin');
});

test('class starters name every method in every language', () => {
  for (const l of LANGUAGES) {
    const code = starterCode(l.id, minStack);
    for (const m of minStack.methods) assert.ok(code.includes(methodName(l.id, 'MinStack', m.name)), `${l.id} ${m.name}`);
  }
});

test('struct types map per language and starters document the definition', () => {
  assert.equal(typeIn('go', 'ListNode'), '*ListNode');
  assert.equal(typeIn('c', 'TreeNode'), 'struct TreeNode*');
  assert.equal(typeIn('typescript', 'ListNode[]'), '(ListNode | null)[]');
  const sig = { name: 'maxDepth', params: [{ name: 'root', type: 'TreeNode' }], returns: 'int' };
  for (const l of LANGUAGES) assert.ok(starterCode(l.id, sig).includes('TreeNode'), l.id);
});

test('ListNode@cycle is an input-only plain ListNode in every language', () => {
  assert.deepEqual(parseType('ListNode@cycle'), { base: 'ListNode', dims: 0, struct: true, cycle: true });
  assert.throws(() => parseType('TreeNode@cycle'));
  assert.throws(() => parseType('ListNode@cycle[]'));
  assert.throws(() => parseType('ListNode@loop'));
  const sig = { name: 'hasCycle', params: [{ name: 'head', type: 'ListNode@cycle' }], returns: 'bool' };
  assert.deepEqual(validateSignature(sig), []);
  assert.equal(typeIn('go', 'ListNode@cycle'), '*ListNode');
  for (const l of LANGUAGES) {
    const code = starterCode(l.id, sig);
    assert.ok(code.includes('ListNode') && !code.includes('@cycle') && !code.includes('pos'), l.id);
  }
  assert.ok(validateSignature({ name: 'f', params: [], returns: 'ListNode@cycle' }).some((e) => e.includes('input only')));
});

test('RandomListNode maps per language and starters document it', () => {
  assert.deepEqual(parseType('RandomListNode'), { base: 'RandomListNode', dims: 0, struct: true });
  assert.throws(() => parseType('RandomListNode[]'));
  assert.equal(typeIn('c', 'RandomListNode'), 'struct RandomListNode*');
  assert.equal(typeIn('typescript', 'RandomListNode'), 'RandomListNode | null');
  assert.equal(typeIn('python', 'RandomListNode'), 'Optional[RandomListNode]');
  const sig = { name: 'copyRandomList', params: [{ name: 'head', type: 'RandomListNode' }], returns: 'RandomListNode' };
  assert.deepEqual(validateSignature(sig), []);
  for (const l of LANGUAGES) assert.ok(/random/.test(starterCode(l.id, sig)), l.id);
  assert.ok(starterCode('cpp', sig).includes('RandomListNode* copyRandomList(RandomListNode* head)'));
});

test('NestedInteger[] uses LeetCode spellings and is input only', () => {
  assert.deepEqual(parseType('NestedInteger[]'), { base: 'NestedInteger', dims: 1, struct: true });
  assert.throws(() => parseType('NestedInteger'));
  assert.throws(() => parseType('NestedInteger[][]'));
  assert.equal(typeIn('java', 'NestedInteger[]'), 'List<NestedInteger>');
  assert.equal(typeIn('csharp', 'NestedInteger[]'), 'IList<NestedInteger>');
  assert.equal(typeIn('go', 'NestedInteger[]'), '[]*NestedInteger');
  assert.equal(typeIn('cpp', 'NestedInteger[]'), 'vector<NestedInteger>');
  assert.equal(typeIn('python', 'NestedInteger[]'), 'list[NestedInteger]');
  const sig = {
    kind: 'class',
    name: 'NestedIterator',
    constructor: { params: [{ name: 'nestedList', type: 'NestedInteger[]' }] },
    methods: [
      { name: 'next', params: [], returns: 'int' },
      { name: 'hasNext', params: [], returns: 'bool' },
    ],
  };
  assert.deepEqual(validateSignature(sig), []);
  // Java's List needs java.util, so the starter imports it ahead of the class.
  assert.ok(starterCode('java', sig).startsWith('import java.util.*;'));
  assert.ok(starterCode('c', sig).includes('nestedIteratorCreate(struct NestedInteger** nestedList, int nestedListSize)'));
  for (const l of LANGUAGES) assert.ok(/[iI]s_?[iI]nteger/.test(starterCode(l.id, sig)), l.id);
  const bad = { ...sig, methods: [{ name: 'peek', params: [], returns: 'NestedInteger[]' }] };
  assert.ok(validateSignature(bad).some((e) => e.includes('input only')));
});
