// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0070.Climbing%20Stairs/Solution.js
/**
 * O(n) time, O(1) space - the last move is 1 or 2 steps, so ways(n) = ways(n - 1) + ways(n - 2).
 * @param {number} n
 * @return {number}
 */
function climbStairs(n) {
  const MOD = 1000000007;
  let a = 0;
  let b = 1;
  for (let i = 0; i < n; ++i) {
    // Reduce every step: unreduced counts lose precision past 2^53 within about 80 steps.
    const c = (a + b) % MOD;
    a = b;
    b = c;
  }
  return b;
}
