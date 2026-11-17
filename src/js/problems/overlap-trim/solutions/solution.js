// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0400-0499/0435.Non-overlapping%20Intervals/Solution.ts
/**
 * O(n log n) time - keeping the interval that ends first leaves the most room for the rest.
 * @param {number[][]} intervals
 * @return {number}
 */
function eraseOverlapIntervals(intervals) {
  // Copy before sorting: the caller's array is not ours to reorder.
  const sorted = [...intervals].sort((a, b) => a[1] - b[1]);
  let ans = intervals.length;
  let lastEnd = -Infinity;
  for (const [start, end] of sorted) {
    // '>=' because touching at an endpoint is not an overlap.
    if (start >= lastEnd) {
      --ans;
      lastEnd = end;
    }
  }
  return ans;
}
