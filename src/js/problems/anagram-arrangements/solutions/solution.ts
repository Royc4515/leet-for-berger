const MOD = 1000000007n;

// Binary exponentiation in BigInt: two residues multiply past 2^53.
function powMod(x: bigint, n: bigint): bigint {
  let res = 1n;
  for (; n > 0n; n >>= 1n) {
    if (n & 1n) res = (res * x) % MOD;
    x = (x * x) % MOD;
  }
  return res;
}

// O(n + log MOD) - the answer is the product over words of len! / (c_a! * c_b! * ...). Both
// products are built letter by letter: the i-th letter of a word multiplies the numerator by i,
// and the k-th copy of a letter multiplies the denominator by k.
function countArrangements(s: string): number {
  // BigInt throughout: a product of two residues reaches 10^18, past what a double holds exactly.
  let ans = 1n;
  let mul = 1n;
  for (const w of s.split(' ')) {
    const cnt: number[] = new Array(26).fill(0);
    for (let i = 0; i < w.length; i++) {
      const c = w.charCodeAt(i) - 97;
      cnt[c]++;
      ans = (ans * BigInt(i + 1)) % MOD;
      mul = (mul * BigInt(cnt[c])) % MOD;
    }
  }
  // MOD is prime, so dividing is multiplying by the inverse (Fermat: x^(MOD-2)); one inverse at
  // the end suffices.
  return Number((ans * powMod(mul, MOD - 2n)) % MOD);
}
