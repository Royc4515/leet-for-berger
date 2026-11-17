/**
 * O(n log n) - bottom-up merge sort. Before merging two sorted runs, one forward sweep counts,
 * for each right-run value, the left-run values above twice it. Numbers are doubles, so
 * 2 * x and the count (up to about 5 * 10^9) stay exact.
 * @param {number[]} nums
 * @return {number}
 */
function reversePairs(nums) {
  const n = nums.length;
  let a = Float64Array.from(nums);
  let buf = new Float64Array(n);
  let count = 0;
  for (let width = 1; width < n; width *= 2) {
    for (let lo = 0; lo < n; lo += 2 * width) {
      const mid = Math.min(lo + width, n);
      const hi = Math.min(lo + 2 * width, n);
      // As the right value grows, the first left value above twice it only moves right.
      let i = lo;
      for (let j = mid; j < hi; j++) {
        while (i < mid && a[i] <= 2 * a[j]) i++;
        count += mid - i;
      }
      let p = lo;
      let q = mid;
      for (let k = lo; k < hi; k++) buf[k] = q >= hi || (p < mid && a[p] <= a[q]) ? a[p++] : a[q++];
    }
    [a, buf] = [buf, a];
  }
  return count;
}
