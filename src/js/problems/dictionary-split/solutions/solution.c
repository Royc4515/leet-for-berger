// O(n * L * log w) time for text length n, longest word L and w words: reach[i] says the first i
// characters split cleanly. C has no hash set, so the words are sorted once and each piece is
// found by binary search.
static int cmpWords(const void* a, const void* b) {
    return strcmp(*(char* const*)a, *(char* const*)b);
}

bool canSplit(char* text, char** words, int wordsSize) {
    char** sorted = malloc(sizeof(char*) * wordsSize);
    memcpy(sorted, words, sizeof(char*) * wordsSize);
    qsort(sorted, wordsSize, sizeof(char*), cmpWords);
    // Only lengths that occur in the dictionary can end a piece.
    bool present[64] = {false};
    int maxLen = 0;
    for (int i = 0; i < wordsSize; i++) {
        int len = (int)strlen(words[i]);
        present[len] = true;
        if (len > maxLen) maxLen = len;
    }
    int n = (int)strlen(text);
    bool* reach = calloc(n + 1, sizeof(bool));
    reach[0] = true;
    char piece[64];
    for (int i = 1; i <= n; i++) {
        for (int len = 1; len <= maxLen && len <= i; len++) {
            if (!present[len] || !reach[i - len]) continue;
            memcpy(piece, text + i - len, len);
            piece[len] = '\0';
            char* key = piece;
            if (bsearch(&key, sorted, wordsSize, sizeof(char*), cmpWords)) {
                reach[i] = true;
                break;
            }
        }
    }
    bool answer = reach[n];
    free(reach);
    free(sorted);
    return answer;
}
