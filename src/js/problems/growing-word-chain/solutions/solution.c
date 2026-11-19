// O(n * L^2 log n) time, O(n) space. C has no hash map, so a dictionary of the words sorted
// alphabetically stands in for it: each candidate predecessor is found by binary search.
static char** gWords;

static int byLength(const void* a, const void* b) {
    size_t x = strlen(gWords[*(const int*)a]), y = strlen(gWords[*(const int*)b]);
    return (x > y) - (x < y);
}

static int byText(const void* a, const void* b) {
    return strcmp(gWords[*(const int*)a], gWords[*(const int*)b]);
}

int longestChain(char** words, int wordsSize) {
    gWords = words;
    int* order = malloc(sizeof(int) * wordsSize);
    int* dict = malloc(sizeof(int) * wordsSize);
    int* best = calloc(wordsSize, sizeof(int));
    for (int i = 0; i < wordsSize; i++) order[i] = dict[i] = i;
    // Short words first, so every predecessor already holds its final chain length.
    qsort(order, wordsSize, sizeof(int), byLength);
    qsort(dict, wordsSize, sizeof(int), byText);

    char prev[17];
    int answer = 0;
    for (int k = 0; k < wordsSize; k++) {
        const char* w = words[order[k]];
        int len = strlen(w), here = 1;
        // Deleting one letter lists every word that can grow into w: at most L lookups, no pair scan.
        for (int i = 0; i < len; i++) {
            memcpy(prev, w, i);
            memcpy(prev + i, w + i + 1, len - i);
            int lo = 0, hi = wordsSize - 1;
            while (lo <= hi) {
                int mid = lo + (hi - lo) / 2;
                int c = strcmp(words[dict[mid]], prev);
                if (c == 0) {
                    // Copies of a word share one value: all are shorter than w, so all are final.
                    if (best[dict[mid]] + 1 > here) here = best[dict[mid]] + 1;
                    break;
                }
                if (c < 0) lo = mid + 1; else hi = mid - 1;
            }
        }
        best[order[k]] = here;
        if (here > answer) answer = here;
    }
    free(order);
    free(dict);
    free(best);
    return answer;
}
