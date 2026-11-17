public class Solution {
    private const int Mod = 1_000_000_007;

    // O(n) time, O(1) space - the last move is 1 or 2 steps, so ways(n) = ways(n - 1) + ways(n - 2).
    public int ClimbStairs(int n) {
        int a = 0, b = 1;
        for (int i = 0; i < n; ++i) {
            // Two residues can sum past 2^31 - 1, so add in long before reducing.
            int c = (int)(((long)a + b) % Mod);
            a = b;
            b = c;
        }
        return b;
    }
}
