// O(n * k log k + n log n) time - sort each word's letters into a key, then sort word
// positions by (key, position) so each group is contiguous and in input order.
typedef struct { char* key; int pos; } Entry;

static int cmpChar(const void* a, const void* b) { return *(const char*)a - *(const char*)b; }

static int cmpEntry(const void* a, const void* b) {
    const Entry* x = a; const Entry* y = b;
    int c = strcmp(x->key, y->key);
    return c ? c : x->pos - y->pos;
}

static int cmpByFirst(const void* a, const void* b) {
    int x = ((const int*)a)[0], y = ((const int*)b)[0];
    return x - y;
}

char*** groupAnagrams(char** words, int wordsSize, int* returnSize, int** returnColumnSizes) {
    Entry* e = malloc(sizeof(Entry) * (wordsSize ? wordsSize : 1));
    for (int i = 0; i < wordsSize; i++) {
        int len = strlen(words[i]);
        e[i].key = malloc(len + 1);
        memcpy(e[i].key, words[i], len + 1);
        qsort(e[i].key, len, 1, cmpChar);
        e[i].pos = i;
    }
    qsort(e, wordsSize, sizeof(Entry), cmpEntry);
    // runs[g] = {first position, start in e, length}; ordering runs by first position gives
    // first-appearance group order.
    int (*runs)[3] = malloc(sizeof(int[3]) * (wordsSize ? wordsSize : 1));
    int g = 0;
    for (int i = 0; i < wordsSize; i++) {
        if (i == 0 || strcmp(e[i].key, e[i - 1].key) != 0) {
            runs[g][0] = e[i].pos;
            runs[g][1] = i;
            runs[g][2] = 0;
            g++;
        }
        runs[g - 1][2]++;
    }
    qsort(runs, g, sizeof(int[3]), cmpByFirst);
    char*** out = malloc(sizeof(char**) * (g ? g : 1));
    *returnColumnSizes = malloc(sizeof(int) * (g ? g : 1));
    for (int k = 0; k < g; k++) {
        int start = runs[k][1], len = runs[k][2];
        out[k] = malloc(sizeof(char*) * len);
        for (int j = 0; j < len; j++) out[k][j] = words[e[start + j].pos];
        (*returnColumnSizes)[k] = len;
    }
    for (int i = 0; i < wordsSize; i++) free(e[i].key);
    free(e);
    free(runs);
    *returnSize = g;
    return out;
}
