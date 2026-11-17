// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0079.Word%20Search/Solution.ts
// O(rows * cols * 3^len) worst case - backtracking, with two prunes that make the pathological
// boards (one letter everywhere) instant.
function exist(board: string[], word: string): boolean {
  const [m, n] = [board.length, board[0].length];
  const have = new Map<string, number>();
  for (const row of board) for (const c of row) have.set(c, (have.get(c) ?? 0) + 1);
  const need = new Map<string, number>();
  for (const c of word) need.set(c, (need.get(c) ?? 0) + 1);
  // Not enough copies of some letter: no path can exist, so skip the search entirely.
  for (const [c, k] of need) if ((have.get(c) ?? 0) < k) return false;
  // A path read backwards is still a path. Starting from the rarer end cuts most branches early.
  if (have.get(word[0])! > have.get(word[word.length - 1])!) word = [...word].reverse().join('');
  const grid = board.map((row) => [...row]);
  const dirs = [-1, 0, 1, 0, -1];
  const dfs = (i: number, j: number, k: number): boolean => {
    if (grid[i][j] !== word[k]) return false;
    if (k === word.length - 1) return true;
    const c = grid[i][j];
    // A character that never occurs in a word marks the cell as on the current path.
    grid[i][j] = '#';
    let found = false;
    for (let u = 0; u < 4 && !found; ++u) {
      const [x, y] = [i + dirs[u], j + dirs[u + 1]];
      found = x >= 0 && x < m && y >= 0 && y < n && dfs(x, y, k + 1);
    }
    // Unmark on the way back, or later starting cells would find this cell blocked.
    grid[i][j] = c;
    return found;
  };
  for (let i = 0; i < m; ++i) {
    for (let j = 0; j < n; ++j) {
      if (dfs(i, j, 0)) return true;
    }
  }
  return false;
}
