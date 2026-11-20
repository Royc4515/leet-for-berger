// O(n) time: walk from the right end so the words come out already in reverse order. Skipping
// every space before a word drops leading, trailing and repeated spaces in one move.
char* flipWordOrder(char* s) {
    int n = (int)strlen(s);
    // The answer is never longer than the input, so one malloc of n + 1 is always enough.
    char* out = malloc(n + 1);
    int len = 0;
    int i = n - 1;
    while (i >= 0) {
        while (i >= 0 && s[i] == ' ') i--;
        if (i < 0) break;
        int end = i;
        while (i >= 0 && s[i] != ' ') i--;
        if (len > 0) out[len++] = ' ';
        memcpy(out + len, s + i + 1, end - i);
        len += end - i;
    }
    out[len] = '\0';
    return out;
}
