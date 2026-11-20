// O(n log n) time: positions do not matter, so sort a copy and count pairs with a sum of at most x
// using two pointers. The window [lower, upper] is count(upper) - count(lower - 1).
function countBoundedPairs(nums: number[], lower: number, upper: number): number {
  // A typed array sorts numerically; a plain array would need a comparator.
  const a = Int32Array.from(nums).sort();
  const atMost = (limit: number): number => {
    let count = 0;
    let lo = 0;
    let hi = a.length - 1;
    while (lo < hi) {
      if (a[lo] + a[hi] <= limit) {
        // a[lo] pairs with every index in (lo, hi]: all of them are at most a[hi].
        count += hi - lo;
        lo++;
      } else {
        hi--;
      }
    }
    return count;
  };
  return atMost(upper) - atMost(lower - 1);
}
