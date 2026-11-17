class Solution {
    private static final long MOD = 1_000_000_007L;

    // O(log n) time - binary exponentiation.
    public int powerMod(int x, long n) {
        // long throughout: two residues below MOD multiply to about 10^18, which needs 64 bits.
        long base = x % MOD;
        long result = 1;
        while (n > 0) {
            // Each set bit of n contributes the matching square x^(2^k).
            if ((n & 1) == 1) result = result * base % MOD;
            base = base * base % MOD;
            n >>= 1;
        }
        return (int) result;
    }
}
