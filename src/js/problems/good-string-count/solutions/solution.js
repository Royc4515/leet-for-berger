/**
 * O(high) time - different step sequences give different strings, so count sequences:
 * f[i] = f[i - zero] + f[i - one], the last step being a block of 0s or a block of 1s.
 * @param {number} low
 * @param {number} high
 * @param {number} zero
 * @param {number} one
 * @return {number}
 */
function countGoodStrings(low, high, zero, one) {
  const MOD = 1000000007;
  const f = new Array(high + 1).fill(0);
  f[0] = 1;
  let ans = 0;
  for (let i = 1; i <= high; i++) {
    // Two residues sum below 2^31, far inside exact double range, so one reduction suffices.
    let ways = 0;
    if (i >= zero) ways += f[i - zero];
    if (i >= one) ways += f[i - one];
    f[i] = ways % MOD;
    if (i >= low) ans = (ans + f[i]) % MOD;
  }
  return ans;
}
