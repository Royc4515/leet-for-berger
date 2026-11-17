/**
 * O(n) time, O(1) space - only the last two values are needed. A loop instead of recursion:
 * the plain recursion is exponential and a memoized one is 10^6 frames deep.
 * @param {number} n
 * @return {number}
 */
function fibonacciMod(n) {
  const MOD = 1000000007;
  let a = 0;
  let b = 1;
  for (let i = 0; i < n; i++) {
    // Both values are below MOD, so the sum is far below 2^53 and exact before the reduction.
    const c = (a + b) % MOD;
    a = b;
    b = c;
  }
  return a;
}
