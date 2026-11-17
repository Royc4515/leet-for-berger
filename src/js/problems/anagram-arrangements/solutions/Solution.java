class Solution {
    private static final long MOD = 1_000_000_007L;

    // O(n + log MOD) - the answer is the product over words of len! / (c_a! * c_b! * ...). Both
    // products are built letter by letter: the i-th letter of a word multiplies the numerator by
    // i, and the k-th copy of a letter multiplies the denominator by k.
    public int countArrangements(String s) {
        long ans = 1, mul = 1;
        int[] cnt = new int[26];
        int pos = 0;
        for (int k = 0; k <= s.length(); k++) {
            // A space or the end of the string closes the current word.
            if (k == s.length() || s.charAt(k) == ' ') {
                java.util.Arrays.fill(cnt, 0);
                pos = 0;
                continue;
            }
            int c = s.charAt(k) - 'a';
            ans = ans * (++pos) % MOD;
            mul = mul * (++cnt[c]) % MOD;
        }
        // MOD is prime, so dividing is multiplying by the inverse (Fermat: x^(MOD-2)); one
        // inverse at the end suffices.
        return (int) (ans * powMod(mul, MOD - 2) % MOD);
    }

    private long powMod(long x, long n) {
        long res = 1;
        for (; n > 0; n >>= 1) {
            if ((n & 1) == 1) res = res * x % MOD;
            x = x * x % MOD;
        }
        return res;
    }
}
