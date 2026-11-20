class Solution {
    // O(n) time, O(1) space - xor every index 0..n with every value; present numbers cancel in pairs.
    public int missingNumber(int[] nums) {
        // Start from n: the loop below only visits the indices 0..n-1.
        int result = nums.length;
        for (int i = 0; i < nums.length; i++) result ^= i ^ nums[i];
        return result;
    }
}
