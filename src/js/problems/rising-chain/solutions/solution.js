/**
 * O(n log n) time - tails[k] is the smallest last value of any increasing run of length k + 1.
 * @param {number[]} nums
 * @return {number}
 */
function lengthOfLis(nums) {
  const tails = [];
  for (const x of nums) {
    // First tail >= x, not > x: an equal value must not extend a run.
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    // Appends when lo === tails.length; otherwise a smaller ending for the same length.
    tails[lo] = x;
  }
  return tails.length;
}
