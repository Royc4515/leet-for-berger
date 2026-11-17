class Solution {
    // O(n) time, O(1) extra space - write pointer for the next non-zero slot, read pointer scans.
    public int[] moveZeroes(int[] nums) {
        int write = 0;
        for (int read = 0; read < nums.length; read++) {
            if (nums[read] != 0) nums[write++] = nums[read];
        }
        // Everything from write onward held a value that was already copied forward, or a zero.
        while (write < nums.length) nums[write++] = 0;
        return nums;
    }
}
