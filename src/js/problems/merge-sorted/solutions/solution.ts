// O(m + n) time - two read heads; the smaller front value is always the next output.
function mergeSorted(nums1: number[], nums2: number[]): number[] {
  const out: number[] = new Array(nums1.length + nums2.length);
  let i = 0;
  let j = 0;
  let k = 0;
  while (i < nums1.length && j < nums2.length) {
    // <= takes nums1 first on ties, which keeps the merge stable.
    out[k++] = nums1[i] <= nums2[j] ? nums1[i++] : nums2[j++];
  }
  // At most one of these runs, and what is left is already sorted.
  while (i < nums1.length) out[k++] = nums1[i++];
  while (j < nums2.length) out[k++] = nums2[j++];
  return out;
}
