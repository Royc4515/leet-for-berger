// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1900-1999/1922.Count%20Good%20Numbers/Solution.java
class Solution {
    private static final long MOD = 1_000_000_007L;

    // O(log n) - positions are independent: (n + 1) / 2 even indices with 5 choices and n / 2
    // odd indices with 4.
    public int countGoodStrings(long n) {
        return (int) (powMod(5, (n + 1) >> 1) * powMod(4, n >> 1) % MOD);
    }

    // Binary exponentiation; long throughout because two residues multiply to about 10^18.
    private long powMod(long x, long e) {
        long res = 1;
        while (e != 0) {
            if ((e & 1) == 1) {
                res = res * x % MOD;
            }
            x = x * x % MOD;
            e >>= 1;
        }
        return res;
    }
}
