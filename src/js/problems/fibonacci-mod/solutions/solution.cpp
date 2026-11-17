class Solution {
public:
    // O(n) time, O(1) space - only the last two values are needed. A loop instead of recursion:
    // the plain recursion is exponential and a memoized one is 10^6 frames deep.
    int fibonacciMod(int n) {
        const long long MOD = 1000000007LL;
        // long long: two residues can sum to about 2 * 10^9, past the 32-bit int range.
        long long a = 0, b = 1;
        for (int i = 0; i < n; i++) {
            long long c = (a + b) % MOD;
            a = b;
            b = c;
        }
        return (int)a;
    }
};
