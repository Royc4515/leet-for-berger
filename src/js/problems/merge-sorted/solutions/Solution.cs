public class Solution {
    // O(m + n) time - two read heads; the smaller front value is always the next output.
    public int[] MergeSorted(int[] nums1, int[] nums2) {
        var output = new int[nums1.Length + nums2.Length];
        int i = 0, j = 0, k = 0;
        while (i < nums1.Length && j < nums2.Length) {
            // <= takes nums1 first on ties, which keeps the merge stable.
            output[k++] = nums1[i] <= nums2[j] ? nums1[i++] : nums2[j++];
        }
        // At most one of these runs, and what is left is already sorted.
        while (i < nums1.Length) output[k++] = nums1[i++];
        while (j < nums2.Length) output[k++] = nums2[j++];
        return output;
    }
}
