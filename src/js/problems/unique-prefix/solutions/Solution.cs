public class Solution {
    // O(n) time, O(1) extra space - compact the array in place, then return the kept prefix.
    public int[] RemoveDuplicates(int[] nums) {
        int write = 0;
        for (int read = 0; read < nums.Length; read++) {
            // Sorted input: the last kept value is the only one a new value can repeat.
            if (write == 0 || nums[read] != nums[write - 1]) nums[write++] = nums[read];
        }
        int[] result = new int[write];
        for (int i = 0; i < write; i++) result[i] = nums[i];
        return result;
    }
}
