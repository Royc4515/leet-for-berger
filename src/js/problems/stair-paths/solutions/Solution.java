// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0070.Climbing%20Stairs/Solution.java
class Solution {
    private static final int MOD = 1_000_000_007;

    // O(n) time, O(1) space - the last move is 1 or 2 steps, so ways(n) = ways(n - 1) + ways(n - 2).
    public int climbStairs(int n) {
        int a = 0, b = 1;
        for (int i = 0; i < n; ++i) {
            // Two residues add up to just under 2^31 (2 * 10^9 + 12 > 2^31 - 1), so add in long.
            int c = (int) (((long) a + b) % MOD);
            a = b;
            b = c;
        }
        return b;
    }
}
