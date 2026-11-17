import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/ticket-itinerary/problem.js';

// Brute force: backtracking that tries destinations in sorted order. Codes all have three
// letters, so the first complete trip found is the lexicographically smallest.
function brute(tickets) {
  const order = tickets.map((_, i) => i).sort((a, b) => (tickets[a][1] < tickets[b][1] ? -1 : tickets[a][1] > tickets[b][1] ? 1 : a - b));
  const used = new Array(tickets.length).fill(false);
  const trip = ['JFK'];
  const go = () => {
    if (trip.length === tickets.length + 1) return true;
    const at = trip[trip.length - 1];
    for (const i of order) {
      if (used[i] || tickets[i][0] !== at) continue;
      used[i] = true;
      trip.push(tickets[i][1]);
      if (go()) return true;
      trip.pop();
      used[i] = false;
    }
    return false;
  };
  return go() ? trip : null;
}

test('reference matches backtracking on 1500 random walks', () => {
  const rnd = mulberry32(1202);
  const codes = ['JFK', 'AAA', 'ABC', 'LHR', 'ZZZ'];
  for (let i = 0; i < 1500; i++) {
    const count = 2 + Math.floor(rnd() * 4);
    const length = 1 + Math.floor(rnd() * 8);
    const tickets = [];
    let at = 'JFK';
    for (let s = 0; s < length; s++) {
      let to = codes[Math.floor(rnd() * count)];
      while (to === at) to = codes[Math.floor(rnd() * count)];
      tickets.push([at, to]);
      at = to;
    }
    // Shuffle so input order carries no hint.
    for (let a = tickets.length - 1; a > 0; a--) {
      const b = Math.floor(rnd() * (a + 1));
      [tickets[a], tickets[b]] = [tickets[b], tickets[a]];
    }
    assert.deepEqual(reference(tickets), brute(tickets));
  }
});

test('visible expectations agree; three cases near 3 * 10^4 tickets; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length >= 29999).length >= 3);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[["JFK","jfk"]]').ok, false);
  assert.equal(problem.parseCustomInput('[["JFK","SF"]]').ok, false);
  assert.equal(problem.parseCustomInput('[["JFK","JFK"]]').ok, false);
  // No trip from JFK: the only ticket leaves another airport.
  assert.equal(problem.parseCustomInput('[["SFO","ATL"]]').ok, false);
  // Two tickets out of JFK and none back: a walk would need a missing ATL -> SFO step.
  assert.equal(problem.parseCustomInput('[["JFK","ATL"],["JFK","SFO"]]').ok, false);
  assert.deepEqual(problem.parseCustomInput('[["JFK","SFO"],["SFO","JFK"]]').args, [[['JFK', 'SFO'], ['SFO', 'JFK']]]);
});
