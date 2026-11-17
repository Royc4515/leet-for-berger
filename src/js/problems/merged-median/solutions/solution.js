// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0004.Median%20of%20Two%20Sorted%20Arrays/Solution.js
/**
 * O(log(m + n)) time - find the k-th smallest of the union by discarding k/2 values per step.
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number}
 */
function medianTimesTwo(nums1, nums2) {
  const m = nums1.length;
  const n = nums2.length;
  const f = (i, j, k) => {
    if (i >= m) return nums2[j + k - 1];
    if (j >= n) return nums1[i + k - 1];
    if (k === 1) return Math.min(nums1[i], nums2[j]);
    const p = Math.floor(k / 2);
    // A side with fewer than p values left cannot hold the k-th among its first p, so the other side drops p.
    const x = i + p - 1 < m ? nums1[i + p - 1] : Infinity;
    const y = j + p - 1 < n ? nums2[j + p - 1] : Infinity;
    return x < y ? f(i + p, j, k - p) : f(i, j + p, k - p);
  };
  // The two middle positions coincide when the total is odd, which gives twice the middle value.
  return f(0, 0, Math.floor((m + n + 1) / 2)) + f(0, 0, Math.floor((m + n + 2) / 2));
}
