import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES, entryName, typeIn, parseType, validateSignature, starterCode } from '../src/js/engine/codegen.js';

const sig = { name: 'notifyRecipients', params: [{ name: 'users', type: 'int[][]' }, { name: 'requests', type: 'string[]' }], returns: 'int[]' };

test('eight languages, each with a solution file name', () => {
  assert.equal(LANGUAGES.length, 8);
  assert.deepEqual(new Set(LANGUAGES.map((l) => l.id)).size, 8);
  for (const l of LANGUAGES) assert.ok(l.file);
});

test('entry names follow each language convention', () => {
  assert.equal(entryName('python', 'notifyRecipients'), 'notify_recipients');
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
  assert.deepEqual(parseType('double[]'), { base: 'double', dims: 1 });
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
