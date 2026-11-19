import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterProblems, usedTopics, pickRandom } from '../src/js/modes/battle-picker.js';
import { availableEntries, TOPICS } from '../src/js/problems/index.js';

const entries = [
  { id: 'a', title: 'Two Sum', difficulty: 'Easy', topics: ['arrays-strings'] },
  { id: 'b', title: 'Rain Trap', difficulty: 'Hard', topics: ['arrays-strings'] },
  { id: 'c', title: 'Level Order', difficulty: 'Medium', topics: ['trees'] },
  { id: 'd', title: 'Tree Path Sum', difficulty: 'Medium', topics: ['trees', 'dp'] },
];
const ids = (l) => l.map((p) => p.id);

test('no filters returns everything', () => {
  assert.deepEqual(ids(filterProblems(entries)), ['a', 'b', 'c', 'd']);
});

test('difficulty, topic and title search combine', () => {
  assert.deepEqual(ids(filterProblems(entries, { difficulty: 'Medium' })), ['c', 'd']);
  assert.deepEqual(ids(filterProblems(entries, { topic: 'dp' })), ['d']);
  assert.deepEqual(ids(filterProblems(entries, { topic: 'trees', query: ' TREE' })), ['d']);
  assert.deepEqual(ids(filterProblems(entries, { difficulty: 'Hard', topic: 'trees' })), []);
});

test('usedTopics keeps taxonomy order and drops unused topics', () => {
  const topics = [{ id: 'trees', label: 'Trees' }, { id: 'sql', label: 'SQL' }, { id: 'dp', label: 'DP' }];
  assert.deepEqual(usedTopics(entries, topics).map((t) => t.id), ['trees', 'dp']);
});

test('pickRandom maps [0, 1) onto the list and handles empty lists', () => {
  assert.equal(pickRandom([], 0.5), null);
  assert.equal(pickRandom(entries, 0).id, 'a');
  assert.equal(pickRandom(entries, 0.5).id, 'c');
  assert.equal(pickRandom(entries, 0.999999).id, 'd');
  assert.equal(pickRandom(entries, 1).id, 'd');
});

test('real catalog: difficulty filter narrows the list and every topic has problems', () => {
  const all = availableEntries();
  const hard = filterProblems(all, { difficulty: 'Hard' });
  assert.ok(hard.length > 0 && hard.length < all.length);
  assert.ok(hard.every((p) => p.difficulty === 'Hard'));
  assert.ok(usedTopics(all, TOPICS).length >= 1);
});
