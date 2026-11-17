// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1900-1999/1922.Count%20Good%20Numbers/Solution.ts
const MOD = 1000000007n;

/** Binary exponentiation; BigInt because two residues multiply past 2^53. */
function powMod(x, e) {
  let res = 1n;
  while (e > 0n) {
    if (e & 1n) res = (res * x) % MOD;
    x = (x * x) % MOD;
    e >>= 1n;
  }
  return res;
}

/**
 * O(log n) - positions are independent: ceil(n / 2) even indices with 5 choices and
 * floor(n / 2) odd indices with 4.
 * @param {number} n
 * @return {number}
 */
function countGoodStrings(n) {
  // n is below 2^53, so it converts to BigInt exactly; the halving happens in BigInt.
  const big = BigInt(n);
  return Number((powMod(5n, (big + 1n) / 2n) * powMod(4n, big / 2n)) % MOD);
}
