import java.util.*;

class Solution {
    // O(n) time, O(1) extra space - compact the array in place, then return the kept prefix.
    public int[] removeDuplicates(int[] nums) {
        int write = 0;
        for (int read = 0; read < nums.length; read++) {
            // Sorted input: the last kept value is the only one a new value can repeat.
            if (write == 0 || nums[read] != nums[write - 1]) nums[write++] = nums[read];
        }
        return Arrays.copyOf(nums, write);
    }
}
