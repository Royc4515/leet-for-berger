const MOD = 1000000007n;

/**
 * O(log n) time - binary exponentiation.
 * @param {number} x
 * @param {number} n
 * @return {number}
 */
function powerMod(x, n) {
  // Two residues multiply to about 10^18, past the 2^53 a double holds exactly, so the
  // arithmetic runs in BigInt. Bit operators on numbers would also truncate n to 32 bits.
  let base = BigInt(x) % MOD;
  let e = BigInt(n);
  let result = 1n;
  while (e > 0n) {
    // Each set bit of n contributes the matching square x^(2^k).
    if (e & 1n) result = (result * base) % MOD;
    base = (base * base) % MOD;
    e >>= 1n;
  }
  return Number(result);
}
