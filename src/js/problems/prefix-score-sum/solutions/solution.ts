// O(n) - the Z-function. z[i] is the score of the suffix at i; [l, r] is the rightmost segment
// known to equal a prefix, and inside it z values are copied instead of recomputed.
function prefixScoreSum(s: string): number {
  const n = s.length;
  const z = new Int32Array(n);
  // The whole string scores n. The total stays below 2^53, so a plain number is exact.
  let total = n;
  for (let i = 1, l = 0, r = 0; i < n; i++) {
    // s[i..r] equals s[i-l..r-l], so z[i - l] applies, capped at the known segment.
    if (i <= r) z[i] = Math.min(r - i + 1, z[i - l]);
    while (i + z[i] < n && s.charCodeAt(z[i]) === s.charCodeAt(i + z[i])) z[i]++;
    if (i + z[i] - 1 > r) {
      l = i;
      r = i + z[i] - 1;
    }
    total += z[i];
  }
  return total;
}
