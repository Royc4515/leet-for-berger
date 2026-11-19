// O(n * k^2): split every word w = a + b at every position. If b is a palindrome, the partner on
// the right must be exactly reverse(a); if a is a palindrome, the partner on the left must be
// exactly reverse(b). An open-addressing hash table from word to index finds either in O(k).
typedef struct {
    char** words;
    int* slots;  // word index per slot, -1 when empty
    unsigned mask;
} WordTable;

static unsigned hashText(const char* s, int len) {
    unsigned h = 2166136261u;  // FNV-1a
    for (int i = 0; i < len; i++) h = (h ^ (unsigned char)s[i]) * 16777619u;
    return h;
}

// Index of the word equal to s[0..len), or -1.
static int tableFind(const WordTable* t, const char* s, int len) {
    for (unsigned h = hashText(s, len) & t->mask;; h = (h + 1) & t->mask) {
        int idx = t->slots[h];
        if (idx < 0) return -1;
        const char* w = t->words[idx];
        if ((int)strlen(w) == len && memcmp(w, s, len) == 0) return idx;
    }
}

static bool isPalindromeRange(const char* s, int lo, int hi) {
    while (lo < hi)
        if (s[lo++] != s[hi--]) return false;
    return true;
}

static int cmpPair(const void* a, const void* b) {
    const int* x = *(int* const*)a;
    const int* y = *(int* const*)b;
    return x[0] != y[0] ? (x[0] > y[0]) - (x[0] < y[0]) : (x[1] > y[1]) - (x[1] < y[1]);
}

int** palindromeJoins(char** words, int wordsSize, int* returnSize, int** returnColumnSizes) {
    // A table at most half full keeps probe chains short.
    unsigned cap = 1;
    while (cap < 2u * (unsigned)wordsSize) cap <<= 1;
    WordTable t = { words, malloc(sizeof(int) * cap), cap - 1 };
    for (unsigned i = 0; i < cap; i++) t.slots[i] = -1;
    for (int i = 0; i < wordsSize; i++) {
        unsigned h = hashText(words[i], strlen(words[i])) & t.mask;
        while (t.slots[h] >= 0) h = (h + 1) & t.mask;
        t.slots[h] = i;
    }

    int size = 0, capOut = 16;
    int** out = malloc(sizeof(int*) * capOut);
    char rev[64];
    for (int i = 0; i < wordsSize; i++) {
        const char* w = words[i];
        int m = strlen(w);
        for (int j = 0; j <= m; j++) {
            int pairs[2][2];
            int count = 0;
            // a = w[0..j): its reverse on the right completes w when b = w[j..m) is a palindrome.
            for (int x = 0; x < j; x++) rev[x] = w[j - 1 - x];
            int k = tableFind(&t, rev, j);
            if (k >= 0 && k != i && isPalindromeRange(w, j, m - 1)) {
                pairs[count][0] = i;
                pairs[count++][1] = k;
            }
            // j > 0: an empty a would find the same equal-length mirror pair a second time.
            if (j > 0) {
                for (int x = 0; x < m - j; x++) rev[x] = w[m - 1 - x];
                k = tableFind(&t, rev, m - j);
                if (k >= 0 && k != i && isPalindromeRange(w, 0, j - 1)) {
                    pairs[count][0] = k;
                    pairs[count++][1] = i;
                }
            }
            for (int c = 0; c < count; c++) {
                if (size == capOut) {
                    capOut *= 2;
                    out = realloc(out, sizeof(int*) * capOut);
                }
                out[size] = malloc(sizeof(int) * 2);
                out[size][0] = pairs[c][0];
                out[size][1] = pairs[c][1];
                size++;
            }
        }
    }
    free(t.slots);

    qsort(out, size, sizeof(int*), cmpPair);
    *returnColumnSizes = malloc(sizeof(int) * (size ? size : 1));
    for (int i = 0; i < size; i++) (*returnColumnSizes)[i] = 2;
    *returnSize = size;
    return out;
}
