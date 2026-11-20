import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/sudoku-check/problem.js';

// Brute force: compare every pair of filled cells directly. Two cells clash when they hold the
// same digit and share a row, a column or a 3x3 box (same band of three rows and of three columns).
function brute(board) {
  const cells = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (board[r][c] !== '.') cells.push([r, c, board[r][c]]);
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const [r1, c1, d1] = cells[i];
      const [r2, c2, d2] = cells[j];
      if (d1 !== d2) continue;
      if (r1 === r2 || c1 === c2 || (Math.floor(r1 / 3) === Math.floor(r2 / 3) && Math.floor(c1 / 3) === Math.floor(c2 / 3))) return false;
    }
  }
  return true;
}

/** A random board: digits dropped on random cells, so most boards clash and a fair share do not. */
function randomBoard(rnd) {
  const filled = Math.floor(rnd() * 14);
  const grid = Array.from({ length: 9 }, () => new Array(9).fill('.'));
  for (let i = 0; i < filled; i++) grid[Math.floor(rnd() * 9)][Math.floor(rnd() * 9)] = String(1 + Math.floor(rnd() * 9));
  return grid.map((row) => row.join(''));
}

test('reference matches brute force on 3000 random boards, both outcomes represented', () => {
  const rnd = mulberry32(36);
  let valid = 0;
  for (let i = 0; i < 3000; i++) {
    const board = randomBoard(rnd);
    const want = brute(board);
    if (want) valid++;
    assert.equal(reference(board), want, board.join('/'));
  }
  assert.ok(valid > 300 && valid < 2700, `${valid} valid boards`);
});

test('5 visible and 10 hidden cases, visible expectations agree, both answers occur', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of problem.hiddenTests) assert.equal(brute(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
  const answers = problem.hiddenTests.map((t) => t.expected);
  assert.ok(answers.filter(Boolean).length >= 4 && answers.filter((a) => !a).length >= 4);
  // Two full grids (81 digits) are the maximum-size cases; the board shape is fixed.
  const full = problem.hiddenTests.filter((t) => t.args[0].join('').indexOf('.') < 0);
  assert.equal(full.length, 2);
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Rows and columns only: two equal digits sharing just a box slip through.
  const noBoxes = (board) => {
    for (let a = 0; a < 9; a++) {
      const row = [...board[a]].filter((x) => x !== '.');
      const col = board.map((r) => r[a]).filter((x) => x !== '.');
      if (new Set(row).size !== row.length || new Set(col).size !== col.length) return false;
    }
    return true;
  };
  // Box index r / 3 + c / 3 merges different boxes (0 + 2 and 1 + 1 both give 2).
  const badBoxIndex = (board) => {
    const seen = Array.from({ length: 5 }, () => new Set());
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const ch = board[r][c];
        if (ch === '.') continue;
        const b = Math.floor(r / 3) + Math.floor(c / 3);
        if (seen[b].has(ch)) return false;
        seen[b].add(ch);
      }
    }
    return noBoxes(board);
  };
  // A dot counts as a digit, so a board with two empty cells in a row is rejected.
  const dotsAreDigits = (board) => {
    for (let a = 0; a < 9; a++) {
      const row = [...board[a]];
      const col = board.map((r) => r[a]);
      if (new Set(row).size !== 9 || new Set(col).size !== 9) return false;
    }
    return reference(board);
  };
  // Demands a solvable board: an empty cell with no candidate digit left makes it fail.
  const needsCandidates = (board) => {
    if (!reference(board)) return false;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] !== '.') continue;
        let any = false;
        for (let d = 1; d <= 9 && !any; d++) {
          const ch = String(d);
          const inRow = board[r].includes(ch);
          const inCol = board.some((row) => row[c] === ch);
          const br = r - (r % 3);
          const bc = c - (c % 3);
          let inBox = false;
          for (let i = br; i < br + 3; i++) for (let j = bc; j < bc + 3; j++) if (board[i][j] === ch) inBox = true;
          any = !inRow && !inCol && !inBox;
        }
        if (!any) return false;
      }
    }
    return true;
  };
  for (const [name, wrong] of [
    ['rows and columns only', noBoxes],
    ['box index r/3 + c/3', badBoxIndex],
    ['dots count as digits', dotsAreDigits],
    ['requires solvable', needsCandidates],
  ]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  const ok = ['1...5...9', '.5.7.9.2.', '7.9.2.4..', '23.....91', '...89.2.4', '8.1.3...7', '.4.6.8.1.', '6...1.3.5', '9.2...6.8'];
  assert.deepEqual(problem.parseCustomInput(JSON.stringify(ok)).args, [ok]);
  assert.equal(problem.parseCustomInput(JSON.stringify(ok.slice(1))).ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify([...ok.slice(1), '.........x'])).ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify([...ok.slice(1), '0........'])).ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify([...ok.slice(1), '........'])).ok, false);
  assert.equal(problem.parseCustomInput('not json').ok, false);
  assert.equal(problem.solveReference([ok]), true);
});
