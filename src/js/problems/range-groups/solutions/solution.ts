// O(n log n) - ranges that overlap through a chain must share a group, so they form blocks
// (the merged intervals) and each block independently picks group 1 or 2: 2^blocks ways.
function countSplits(ranges: number[][]): number {
  const MOD = 1000000007;
  // Sort a copy of the rows: the caller's array is not ours to reorder.
  const sorted = ranges.slice().sort((a, b) => a[0] - b[0]);
  let blocks = 0;
  let reach = -1; // furthest end seen so far
  for (const [start, end] of sorted) {
    // `>` and not `>=`: ranges are closed, so a range starting at `reach` still shares it.
    if (start > reach) blocks++;
    // max, not end: a nested range must not shorten the reach of the one around it.
    if (end > reach) reach = end;
  }
  // The modulus is applied while doubling: 2^100000 is far beyond a double's exact range.
  let ways = 1;
  for (let i = 0; i < blocks; i++) ways = (ways * 2) % MOD;
  return ways;
}
