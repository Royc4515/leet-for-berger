// O(n) time. i marks the start of a run, j walks to its end; the next run starts at j, so the last
// run needs no separate flush.
char* squeezeRuns(char* s) {
    int n = (int)strlen(s);
    // The result is never longer than the input (a run of L becomes at most L characters for
    // L >= 2, and 1 for L = 1), so n + 1 bytes always suffice.
    char* out = malloc(n + 1);
    int len = 0;
    int i = 0;
    while (i < n) {
        int j = i;
        while (j < n && s[j] == s[i]) j++;
        out[len++] = s[i];
        // A length of 1 is left implicit; sprintf writes 10 or more as several digits.
        if (j - i > 1) len += sprintf(out + len, "%d", j - i);
        i = j;
    }
    out[len] = '\0';
    return out;
}
