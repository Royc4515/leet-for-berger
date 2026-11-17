public class Solution {
    // O(n) time, O(1) space - x ^ x == 0 and XOR is order independent, so every pair cancels
    // and only the lone value survives the fold.
    public int SingleNumber(int[] nums) {
        int x = 0;
        foreach (int v in nums) x ^= v;
        return x;
    }
}
