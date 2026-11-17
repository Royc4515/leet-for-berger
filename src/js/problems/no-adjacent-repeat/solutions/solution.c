// O(26 * n) time - greedy left to right. With m letters still to place, a letter occurring more
// than m / 2 times must go next; otherwise the smallest letter that differs from the previous
// one keeps the rest arrangeable.
char* reorganizeString(char* s) {
    int n = strlen(s);
    int cnt[26] = {0};
    int max = 0;
    for (int i = 0; i < n; i++) {
        int c = s[i] - 'a';
        if (++cnt[c] > max) max = cnt[c];
    }
    char* out = malloc(n + 1);
    // Beyond ceil(n / 2) copies, two of them must touch.
    if (max > (n + 1) / 2) {
        out[0] = '\0';
        return out;
    }
    int prev = -1;
    for (int i = 0, m = n; m > 0; i++, m--) {
        int pick = -1;
        // At most one letter can exceed half of what is left, so the first hit is the only one.
        for (int c = 0; c < 26 && pick < 0; c++) if (2 * cnt[c] > m) pick = c;
        for (int c = 0; c < 26 && pick < 0; c++) if (cnt[c] > 0 && c != prev) pick = c;
        cnt[pick]--;
        out[i] = 'a' + pick;
        prev = pick;
    }
    out[n] = '\0';
    return out;
}
