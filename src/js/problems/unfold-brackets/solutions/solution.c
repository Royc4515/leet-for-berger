// O(n + m) time for input length n and output length m: one shared buffer, and a closing bracket
// repeats only the slice written since its opening bracket.
char* unfoldBrackets(char* s) {
    size_t n = strlen(s);
    size_t cap = 1024, len = 0;
    char* out = malloc(cap);
    // Every open group needs a slot, and there are at most n / 2 of them.
    size_t* starts = malloc(sizeof(size_t) * (n / 2 + 1));
    int* counts = malloc(sizeof(int) * (n / 2 + 1));
    int top = 0;
    int k = 0;
    for (size_t i = 0; i < n; i++) {
        char ch = s[i];
        if (ch >= '0' && ch <= '9') {
            // Counts can have several digits.
            k = k * 10 + (ch - '0');
        } else if (ch == '[') {
            starts[top] = len;
            counts[top] = k;
            top++;
            k = 0;
        } else if (ch == ']') {
            top--;
            size_t start = starts[top];
            size_t groupLen = len - start;
            size_t need = len + groupLen * (size_t)(counts[top] - 1) + 1;
            if (need > cap) {
                while (cap < need) cap *= 2;
                out = realloc(out, cap);
            }
            // The group is already in the buffer once, so add count - 1 more copies.
            for (int t = 1; t < counts[top]; t++) {
                memcpy(out + len, out + start, groupLen);
                len += groupLen;
            }
        } else {
            if (len + 2 > cap) {
                cap *= 2;
                out = realloc(out, cap);
            }
            out[len++] = ch;
        }
    }
    out[len] = '\0';
    free(starts);
    free(counts);
    return out;
}
