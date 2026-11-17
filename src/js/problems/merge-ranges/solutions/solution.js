/**
 * O(n log n) time - after sorting by start, a range can only overlap the one being built.
 * @param {number[][]} intervals
 * @return {number[][]}
 */
function merge(intervals) {
  // Copy before sorting: the caller's array is not ours to reorder.
  const sorted = intervals.map(([s, e]) => [s, e]).sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    // `<=` because ranges are closed: [1, 4] and [4, 5] share the point 4.
    if (last && start <= last[1]) {
      // max, not end: the current range may already reach past this one.
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}
