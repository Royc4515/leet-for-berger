public class Solution {
    // O(n) - the Z-function. z[i] is the score of the suffix at i; [l, r] is the rightmost
    // segment known to equal a prefix, and inside it z values are copied instead of recomputed.
    public long PrefixScoreSum(string s) {
        int n = s.Length;
        var z = new int[n];
        // long: for n = 10^5 the total is about 5 * 10^9.
        long ans = n;
        for (int i = 1, l = 0, r = 0; i < n; i++) {
            // s[i..r] equals s[i-l..r-l], so z[i - l] applies, capped at the known segment.
            if (i <= r) z[i] = Math.Min(r - i + 1, z[i - l]);
            while (i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++;
            if (i + z[i] - 1 > r) {
                l = i;
                r = i + z[i] - 1;
            }
            ans += z[i];
        }
        return ans;
    }
}
