public class Solution {
    // O(n) time, O(1) space - track only the sign; a running product overflows int and long.
    public int ProductSign(int[] nums) {
        int ans = 1;
        foreach (int v in nums) {
            // A zero decides the answer wherever it appears.
            if (v == 0) return 0;
            if (v < 0) ans = -ans;
        }
        return ans;
    }
}
