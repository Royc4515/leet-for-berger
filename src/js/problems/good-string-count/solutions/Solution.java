// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/2400-2499/2466.Count%20Ways%20To%20Build%20Good%20Strings/Solution.java
class Solution {
    private static final int MOD = (int) 1e9 + 7;

    // O(high) time - different step sequences give different strings, so count sequences:
    // f[i] = f[i - zero] + f[i - one], the last step being a block of 0s or a block of 1s.
    public int countGoodStrings(int low, int high, int zero, int one) {
        // Bottom-up rather than recursive: 10^5 levels is too deep for a default stack.
        int[] f = new int[high + 1];
        f[0] = 1;
        long ans = 0;
        for (int i = 1; i <= high; ++i) {
            // Two residues can sum past 2^31 - 1, so add in long before reducing.
            long ways = 0;
            if (i >= zero) {
                ways += f[i - zero];
            }
            if (i >= one) {
                ways += f[i - one];
            }
            f[i] = (int) (ways % MOD);
            if (i >= low) {
                ans = (ans + f[i]) % MOD;
            }
        }
        return (int) ans;
    }
}
