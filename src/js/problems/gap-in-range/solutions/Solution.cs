public class Solution {
    // O(n) time, O(1) space - xor every index 0..n with every value; present numbers cancel in pairs.
    public int MissingNumber(int[] nums) {
        // Start from n: the loop below only visits the indices 0..n-1.
        int result = nums.Length;
        for (int i = 0; i < nums.Length; i++) result ^= i ^ nums[i];
        return result;
    }
}
