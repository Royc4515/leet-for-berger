public class Solution {
    // O(n) time, O(1) extra space, one pass. [0, lo) holds 0s, [lo, mid) holds 1s, (hi, end] holds
    // 2s, and [mid, hi] is still unknown.
    public int[] FlagSort(int[] nums) {
        int lo = 0, mid = 0, hi = nums.Length - 1;
        while (mid <= hi) {
            if (nums[mid] == 0) {
                (nums[lo], nums[mid]) = (nums[mid], nums[lo]);
                lo++;
                mid++;
            } else if (nums[mid] == 1) {
                mid++;
            } else {
                (nums[mid], nums[hi]) = (nums[hi], nums[mid]);
                // mid stays: the value that just arrived from the right end has not been inspected.
                hi--;
            }
        }
        return nums;
    }
}
