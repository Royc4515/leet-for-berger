// O(n) time - each window is packed into 20 bits (2 bits per letter) and updated in O(1) as it
// slides. With A < C < G < T mapped to 0 < 1 < 2 < 3, numeric order of the codes is alphabetical
// order of the windows, so scanning the codes in increasing order needs no sort.
static int letterCode(char c) {
    switch (c) {
        case 'A': return 0;
        case 'C': return 1;
        case 'G': return 2;
        default: return 3;
    }
}

char** repeatedWindows(char* s, int* returnSize) {
    const int W = 10, SPACE = 1 << 20, MASK = SPACE - 1;
    int n = (int)strlen(s);
    *returnSize = 0;
    // seen[code] counts occurrences, capped at 2 so it fits in a byte.
    unsigned char* seen = calloc(SPACE, 1);
    int code = 0, repeated = 0;
    for (int i = 0; i < n; i++) {
        code = ((code << 2) | letterCode(s[i])) & MASK;
        if (i < W - 1) continue;
        if (seen[code] < 2 && ++seen[code] == 2) repeated++;
    }
    char** ans = malloc(sizeof(char*) * (repeated ? repeated : 1));
    for (int c = 0; c < SPACE; c++) {
        if (seen[c] < 2) continue;
        char* w = malloc(W + 1);
        // Decode from the last letter back: the lowest two bits hold the window's last letter.
        for (int k = W - 1, v = c; k >= 0; k--, v >>= 2) w[k] = "ACGT"[v & 3];
        w[W] = 0;
        ans[(*returnSize)++] = w;
    }
    free(seen);
    return ans;
}
