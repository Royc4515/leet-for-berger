// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0200.Number%20of%20Islands/Solution.ts
// O(rows * cols) time - flood fill each new island once, with an explicit stack because one
// island can be ~45,000 cells deep, more than a worker's call stack allows.
function countIslands(grid: string[]): number {
  const m = grid.length;
  const n = grid[0].length;
  // Strings are immutable, so visited cells live in a separate flat array.
  const seen = new Uint8Array(m * n);
  const dirs = [-1, 0, 1, 0, -1];
  let ans = 0;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] !== '1' || seen[i * n + j]) continue;
      ans++;
      seen[i * n + j] = 1;
      const stack: number[] = [i * n + j];
      while (stack.length) {
        const cell = stack.pop()!;
        const r = Math.floor(cell / n);
        const c = cell % n;
        for (let k = 0; k < 4; k++) {
          const x = r + dirs[k];
          const y = c + dirs[k + 1];
          // Mark on push, not on pop, so no cell enters the stack twice.
          if (x >= 0 && x < m && y >= 0 && y < n && grid[x][y] === '1' && !seen[x * n + y]) {
            seen[x * n + y] = 1;
            stack.push(x * n + y);
          }
        }
      }
    }
  }
  return ans;
}
