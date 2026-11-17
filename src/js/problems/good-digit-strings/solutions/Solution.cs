public class Solution {
    private const long Mod = 1_000_000_007L;

    // O(log n) - positions are independent: (n + 1) / 2 even indices with 5 choices and n / 2
    // odd indices with 4.
    public int CountGoodStrings(long n) {
        return (int)(PowMod(5, (n + 1) >> 1) * PowMod(4, n >> 1) % Mod);
    }

    // Binary exponentiation; long throughout because two residues multiply to about 10^18.
    private static long PowMod(long x, long e) {
        long res = 1;
        while (e != 0) {
            if ((e & 1) == 1) res = res * x % Mod;
            x = x * x % Mod;
            e >>= 1;
        }
        return res;
    }
}
