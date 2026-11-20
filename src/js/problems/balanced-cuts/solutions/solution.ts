// O(n log(sum)) time: binary search the smallest cap for which a greedy pass needs at most k parts.
function minLargestPart(nums: number[], k: number): number {
  const fits = (cap: number): boolean => {
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
  let low = Math.max(...nums);
  let high = nums.reduce((a, b) => a + b, 0);
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (fits(mid)) high = mid;
    else low = mid + 1;
  }
  return low;
}
