public class Solution {
    // O(log n) time - nums[mid] < nums[mid + 1] means mid is on the rising slope, so the peak is right of it.
    public int FindPeakElement(int[] nums) {
        int left = 0, right = nums.Length - 1;
        // left < right keeps mid < right, so mid + 1 is always a valid index.
        while (left < right) {
            int mid = (left + right) >> 1;
            // Falling: the peak is mid itself or somewhere to its left.
            if (nums[mid] > nums[mid + 1]) right = mid;
            else left = mid + 1;
        }
        return left;
    }
}
