public class Solution {
    private const long Mod = 1_000_000_007L;

    // O(n + log Mod) - the answer is the product over words of len! / (c_a! * c_b! * ...). Both
    // products are built letter by letter: the i-th letter of a word multiplies the numerator by
    // i, and the k-th copy of a letter multiplies the denominator by k.
    public int CountArrangements(string s) {
        long ans = 1, mul = 1;
        var cnt = new int[26];
        int pos = 0;
        for (int k = 0; k <= s.Length; k++) {
            // A space or the end of the string closes the current word.
            if (k == s.Length || s[k] == ' ') {
                Array.Clear(cnt, 0, cnt.Length);
                pos = 0;
                continue;
            }
            int c = s[k] - 'a';
            ans = ans * (++pos) % Mod;
            mul = mul * (++cnt[c]) % Mod;
        }
        // Mod is prime, so dividing is multiplying by the inverse (Fermat: x^(Mod-2)); one
        // inverse at the end suffices.
        return (int)(ans * PowMod(mul, Mod - 2) % Mod);
    }

    private static long PowMod(long x, long n) {
        long res = 1;
        for (; n > 0; n >>= 1) {
            if ((n & 1) == 1) res = res * x % Mod;
            x = x * x % Mod;
        }
        return res;
    }
}
