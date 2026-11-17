class Solution {
public:
    // O(log n) time - binary exponentiation.
    int powerMod(int x, long long n) {
        const long long MOD = 1000000007LL;
        // long long throughout: two residues below MOD multiply to about 10^18, which needs 64 bits.
        long long base = x % MOD;
        long long result = 1;
        while (n > 0) {
            // Each set bit of n contributes the matching square x^(2^k).
            if (n & 1) result = result * base % MOD;
            base = base * base % MOD;
            n >>= 1;
        }
        return (int)result;
    }
};
