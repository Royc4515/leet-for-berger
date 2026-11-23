/**
 * O(n + 26 * maxFreq) = O(n) time: group balanced subsequences by their shared frequency k,
 * using precomputed factorials and inverse factorials in BigInt to avoid 53-bit overflow.
 * @param {string} s
 * @return {number}
 */
var countBalancedSubsequences = function (s) {
  const MOD = 1000000007n;
  const counts = new Int32Array(26);
  let maxFreq = 0;
  for (let i = 0; i < s.length; i++) {
    const c = ++counts[s.charCodeAt(i) - 97];
    if (c > maxFreq) maxFreq = c;
  }
  const freqs = [];
  for (let i = 0; i < 26; i++) {
    if (counts[i] > 0) freqs.push(counts[i]);
  }

  const fact = new BigUint64Array(maxFreq + 1);
  const invFact = new BigUint64Array(maxFreq + 1);
  fact[0] = 1n;
  for (let i = 1; i <= maxFreq; i++) {
    fact[i] = (fact[i - 1] * BigInt(i)) % MOD;
  }
  let base = fact[maxFreq];
  let exp = MOD - 2n;
  let inv = 1n;
  while (exp > 0n) {
    if (exp & 1n) inv = (inv * base) % MOD;
    base = (base * base) % MOD;
    exp >>= 1n;
  }
  invFact[maxFreq] = inv;
  for (let i = maxFreq; i >= 1; i--) {
    invFact[i - 1] = (invFact[i] * BigInt(i)) % MOD;
  }

  let total = 0n;
  for (let k = 1; k <= maxFreq; k++) {
    let ways = 1n;
    const invK = invFact[k];
    for (let i = 0; i < freqs.length; i++) {
      const f = freqs[i];
      if (f >= k) {
        const comb = (((fact[f] * invK) % MOD) * invFact[f - k]) % MOD;
        ways = (ways * (1n + comb)) % MOD;
      }
    }
    // Subtract the empty subsequence (all letters choosing 0 copies) for each k.
    total = (total + ways - 1n + MOD) % MOD;
  }
  return Number(total);
};
