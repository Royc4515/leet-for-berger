class Solution {
    private static final long MOD = 1_000_000_007L;

    // O(n + 26 * maxFreq) = O(n) time: fix shared frequency k and multiply (1 + C(f, k)) per letter.
    public int countBalancedSubsequences(String s) {
        int[] counts = new int[26];
        int maxFreq = 0;
        for (int i = 0; i < s.length(); i++) {
            int c = ++counts[s.charAt(i) - 'a'];
            if (c > maxFreq) maxFreq = c;
        }
        int[] freqs = new int[26];
        int m = 0;
        for (int c : counts) {
            if (c > 0) freqs[m++] = c;
        }

        long[] fact = new long[maxFreq + 1];
        long[] invFact = new long[maxFreq + 1];
        fact[0] = 1;
        for (int i = 1; i <= maxFreq; i++) {
            fact[i] = fact[i - 1] * i % MOD;
        }
        invFact[maxFreq] = modPow(fact[maxFreq], MOD - 2);
        for (int i = maxFreq; i >= 1; i--) {
            invFact[i - 1] = invFact[i] * i % MOD;
        }

        long total = 0;
        for (int k = 1; k <= maxFreq; k++) {
            long ways = 1;
            long invK = invFact[k];
            for (int i = 0; i < m; i++) {
                int f = freqs[i];
                if (f >= k) {
                    long comb = fact[f] * invK % MOD * invFact[f - k] % MOD;
                    ways = ways * (1 + comb) % MOD;
                }
            }
            // Subtract the empty subsequence for each k.
            total = (total + ways - 1 + MOD) % MOD;
        }
        return (int) total;
    }

    private long modPow(long base, long exp) {
        long res = 1;
        base %= MOD;
        while (exp > 0) {
            if ((exp & 1) == 1) res = res * base % MOD;
            base = base * base % MOD;
            exp >>= 1;
        }
        return res;
    }
}
