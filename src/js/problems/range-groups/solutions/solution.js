/**
 * O(n log n) - ranges that overlap through a chain must share a group, so they form blocks
 * (the merged intervals) and each block independently picks group 1 or 2: 2^blocks ways.
 * @param {number[][]} ranges
 * @return {number}
 */
function countSplits(ranges) {
  const MOD = 1000000007;
  const n = ranges.length;
  // Sort by start without a comparator: pack (start, index) into one number. A start is below 2^30
  // and an index below 2^17, so the key is exact in a double and orders by start first. The
  // typed-array sort is native, and the caller's array is left alone.
  const keys = new Float64Array(n);
  for (let i = 0; i < n; i++) keys[i] = ranges[i][0] * 131072 + i;
  keys.sort();
  let blocks = 0;
  let reach = -1; // furthest end seen so far
  for (let k = 0; k < n; k++) {
    const range = ranges[keys[k] % 131072];
    // `>` and not `>=`: ranges are closed, so a range starting at `reach` still shares it.
    if (range[0] > reach) blocks++;
    // max, not range[1]: a nested range must not shorten the reach of the one around it.
    if (range[1] > reach) reach = range[1];
  }
  // The modulus is applied while doubling: 2^100000 is far beyond a double's exact range.
  let ways = 1;
  for (let i = 0; i < blocks; i++) ways = (ways * 2) % MOD;
  return ways;
}
