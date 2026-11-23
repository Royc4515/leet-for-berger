class Solution {
    // O(n) time, O(1) extra space: cyclic placement of each value v in 1..n into index v - 1.
    public int smallestPositiveGap(int[] nums) {
        int n = nums.length;
        for (int i = 0; i < n; i++) {
            // Check bounds before computing nums[i] - 1 so Integer.MIN_VALUE never overflows.
            while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {
                int target = nums[i] - 1;
                int tmp = nums[i];
                nums[i] = nums[target];
                nums[target] = tmp;
            }
        }
        for (int i = 0; i < n; i++) {
            if (nums[i] != i + 1) return i + 1;
        }
        return n + 1;
    }
}
