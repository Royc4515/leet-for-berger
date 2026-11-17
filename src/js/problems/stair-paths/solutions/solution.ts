// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0070.Climbing%20Stairs/Solution.ts
// O(n) time, O(1) space - the last move is 1 or 2 steps, so ways(n) = ways(n - 1) + ways(n - 2).
function climbStairs(n: number): number {
  const MOD = 1000000007;
  let p = 1; // ways(0)
  let q = 1; // ways(1)
  for (let i = 1; i < n; i++) {
    // Reduce every step: unreduced counts lose precision past 2^53 within about 80 steps.
    [p, q] = [q, (p + q) % MOD];
  }
  return q;
}
