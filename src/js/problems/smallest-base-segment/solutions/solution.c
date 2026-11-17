// O(n) time, O(n) space - KMP prefix function.
char* smallestBaseSegment(char* s) {
    int n = strlen(s);
    int* pi = malloc(sizeof(int) * n);
    pi[0] = 0;
    for (int i = 1; i < n; i++) {
        int k = pi[i - 1];
        // Fall back through shorter borders until the next char can extend one.
        while (k > 0 && s[i] != s[k]) k = pi[k - 1];
        if (s[i] == s[k]) k++;
        pi[i] = k;
    }
    int period = n - pi[n - 1];
    free(pi);
    // A period only builds s from whole copies when it divides n ("ababa" -> itself).
    if (n % period != 0) return s;
    char* base = malloc(period + 1);
    memcpy(base, s, period);
    base[period] = '\0';
    return base;
}
