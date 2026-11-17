public class Solution {
    private const int Mod = 1_000_000_007;

    // O(high) time - different step sequences give different strings, so count sequences:
    // f[i] = f[i - zero] + f[i - one], the last step being a block of 0s or a block of 1s.
    public int CountGoodStrings(int low, int high, int zero, int one) {
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
            f[i] = (int)(ways % Mod);
            if (i >= low) {
                ans = (ans + f[i]) % Mod;
            }
        }
        return (int)ans;
    }
}
