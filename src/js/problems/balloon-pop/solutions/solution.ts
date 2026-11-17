// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0312.Burst%20Balloons/Solution.ts
// O(n^3) time, O(n^2) space. f[i][j] is the best total for popping everything strictly between
// borders i and j; the balloon popped last has the borders as neighbors, so the sides split.
function maxCoins(nums: number[]): number {
  const n = nums.length;
  const arr = [1, ...nums, 1];
  const f: number[][] = Array.from({ length: n + 2 }, () => new Array(n + 2).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = i + 2; j <= n + 1; j++) {
      let best = 0;
      for (let k = i + 1; k < j; k++) best = Math.max(best, f[i][k] + f[k][j] + arr[i] * arr[k] * arr[j]);
      f[i][j] = best;
    }
  }
  return f[0][n + 1];
}
