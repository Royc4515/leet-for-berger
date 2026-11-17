public class Solution {
    private const long Mod = 1_000_000_007L;

    // O(log n) time - binary exponentiation.
    public int PowerMod(int x, long n) {
        // long throughout: two residues below Mod multiply to about 10^18, which needs 64 bits.
        long b = x % Mod;
        long result = 1;
        while (n > 0) {
            // Each set bit of n contributes the matching square x^(2^k).
            if ((n & 1) == 1) result = result * b % Mod;
            b = b * b % Mod;
            n >>= 1;
        }
        return (int)result;
    }
}
