/**
 * O(n log(sum)) time: binary search the smallest cap for which a greedy pass needs at most k parts.
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function minLargestPart(nums, k) {
  const fits = (cap) => {
    let parts = 1;
    let current = 0;
    for (const v of nums) {
      // Closing a part as late as possible never hurts the parts after it.
      if (current + v > cap) {
        parts++;
        current = v;
      } else {
        current += v;
      }
    }
    return parts <= k;
  };
  // No cap below the largest value can hold that value, and the total always fits in one part.
  // Totals reach 10^10, which a double holds exactly.
  // A loop instead of Math.max(...nums): spreading tens of thousands of arguments risks the call stack limit.
  let low = 0;
  let high = 0;
  for (const v of nums) {
    if (v > low) low = v;
    high += v;
  }
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (fits(mid)) high = mid;
    else low = mid + 1;
  }
  return low;
}
