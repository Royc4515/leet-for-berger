/**
 * O(n) time - i >> 1 drops the lowest bit of i, and its count is already in the table.
 * @param {number} n
 * @return {number[]}
 */
function countBits(n) {
  // n + 1 entries: the count for n itself is part of the answer.
  const tally = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) tally[i] = tally[i >> 1] + (i & 1);
  return tally;
}
