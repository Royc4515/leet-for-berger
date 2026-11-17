// O(n) - the Z-function. z[i] is the score of the suffix at i; [l, r] is the rightmost segment
// known to equal a prefix, and inside it z values are copied instead of recomputed.
long long prefixScoreSum(char* s) {
    int n = (int)strlen(s);
    int* z = calloc(n, sizeof(int));
    // long long: for n = 10^5 the total is about 5 * 10^9.
    long long ans = n;
    for (int i = 1, l = 0, r = 0; i < n; i++) {
        if (i <= r) {
            // s[i..r] equals s[i-l..r-l], so z[i - l] applies, capped at the known segment.
            int copied = z[i - l];
            z[i] = copied < r - i + 1 ? copied : r - i + 1;
        }
        while (i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++;
        if (i + z[i] - 1 > r) {
            l = i;
            r = i + z[i] - 1;
        }
        ans += z[i];
    }
    free(z);
    return ans;
}
