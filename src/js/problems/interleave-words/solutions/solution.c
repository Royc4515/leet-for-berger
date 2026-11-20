// O(n + m) time: alternate while both words have letters, then copy the longer word's tail.
char* interleaveWords(char* word1, char* word2) {
    size_t n = strlen(word1);
    size_t m = strlen(word2);
    // One slot for each letter plus the terminator.
    char* out = malloc(n + m + 1);
    size_t common = n < m ? n : m;
    size_t len = 0;
    for (size_t i = 0; i < common; i++) {
        out[len++] = word1[i];
        out[len++] = word2[i];
    }
    // Only one of these tails is non-empty.
    for (size_t i = common; i < n; i++) out[len++] = word1[i];
    for (size_t i = common; i < m; i++) out[len++] = word2[i];
    out[len] = '\0';
    return out;
}
