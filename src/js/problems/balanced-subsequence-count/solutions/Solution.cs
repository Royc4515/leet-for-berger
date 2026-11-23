public class Solution {
    private const long Mod = 1_000_000_007L;

    // O(n + 26 * maxFreq) = O(n) time: fix shared frequency k and multiply (1 + C(f, k)) per letter.
    public int CountBalancedSubsequences(string s) {
        int[] counts = new int[26];
        int maxFreq = 0;
        for (int i = 0; i < s.Length; i++) {
            int c = ++counts[s[i] - 'a'];
            if (c > maxFreq) maxFreq = c;
        }
        int[] freqs = new int[26];
        int m = 0;
        for (int i = 0; i < 26; i++) {
            if (counts[i] > 0) freqs[m++] = counts[i];
        }

        long[] fact = new long[maxFreq + 1];
        long[] invFact = new long[maxFreq + 1];
        fact[0] = 1;
        for (int i = 1; i <= maxFreq; i++) fact[i] = fact[i - 1] * i % Mod;
        invFact[maxFreq] = ModPow(fact[maxFreq], Mod - 2);
        for (int i = maxFreq; i >= 1; i--) invFact[i - 1] = invFact[i] * i % Mod;

        long total = 0;
        for (int k = 1; k <= maxFreq; k++) {
            long ways = 1;
            long invK = invFact[k];
            for (int i = 0; i < m; i++) {
                int f = freqs[i];
                if (f >= k) {
                    long comb = fact[f] * invK % Mod * invFact[f - k] % Mod;
                    ways = ways * (1 + comb) % Mod;
                }
            }
            total = (total + ways - 1 + Mod) % Mod;
        }
        return (int)total;
    }

    private static long ModPow(long b, long exp) {
        long res = 1;
        b %= Mod;
        while (exp > 0) {
            if ((exp & 1) == 1) res = res * b % Mod;
            b = b * b % Mod;
            exp >>= 1;
        }
        return res;
    }
}
