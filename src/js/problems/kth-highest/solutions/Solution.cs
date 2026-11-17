public class Solution {
    // O(n) average - quickselect: partition around a pivot, then continue in one side only.
    public int FindKthLargest(int[] nums, int k) {
        // The k-th largest is the value at index n - k in ascending order.
        int target = nums.Length - k;
        int l = 0, r = nums.Length - 1;
        // A loop instead of recursion: only one side is ever revisited.
        while (l < r) {
            int i = l - 1, j = r + 1;
            // The middle element as pivot keeps sorted input balanced, and Hoare partitioning stops
            // on equal values from both sides, so all-equal input splits in half instead of n - 1 : 1.
            int x = nums[(l + r) >> 1];
            while (i < j) {
                while (nums[++i] < x) {
                }
                while (nums[--j] > x) {
                }
                if (i < j) (nums[i], nums[j]) = (nums[j], nums[i]);
            }
            // Everything in [l, j] is <= x and everything in [j + 1, r] is >= x.
            if (j < target) l = j + 1;
            else r = j;
        }
        return nums[l];
    }
}
