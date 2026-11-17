public class Solution {
    // O(n) time, O(1) space - only the last two values are needed. A loop instead of recursion:
    // the plain recursion is exponential and a memoized one is 10^6 frames deep.
    public int FibonacciMod(int n) {
        const long Mod = 1_000_000_007L;
        // long: two residues can sum to about 2 * 10^9, past the 32-bit int range.
        long a = 0, b = 1;
        for (int i = 0; i < n; i++) {
            long c = (a + b) % Mod;
            a = b;
            b = c;
        }
        return (int)a;
    }
}
