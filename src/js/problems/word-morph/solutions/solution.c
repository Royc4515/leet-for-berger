// O(N * L * 26) word generations - BFS level by level; neighbours come from trying every
// letter at every position and looking the result up in a hash table, never from comparing
// all pairs of words. C has no hash set, so this is a small open-addressing table.
static unsigned long hashWord(const char* s) {
    // FNV-1a: cheap and spreads short lowercase words well.
    unsigned long h = 2166136261UL;
    for (; *s; s++) h = (h ^ (unsigned char)*s) * 16777619UL;
    return h;
}

// Returns the slot holding word, or -1. The table is a power of two at most half full.
static int findSlot(char** table, int mask, const char* word) {
    for (unsigned long i = hashWord(word) & mask;; i = (i + 1) & mask) {
        if (!table[i]) return -1;
        if (strcmp(table[i], word) == 0) return (int)i;
    }
}

int ladderLength(char* beginWord, char* endWord, char** wordList, int wordListSize) {
    int cap = 1;
    while (cap < 2 * wordListSize) cap <<= 1;
    int mask = cap - 1;
    char** table = calloc(cap, sizeof(char*));
    // visited lives beside the table instead of deleting entries, which would break probing.
    char* visited = calloc(cap, 1);
    for (int k = 0; k < wordListSize; k++) {
        unsigned long i = hashWord(wordList[k]) & mask;
        while (table[i]) i = (i + 1) & mask;
        table[i] = wordList[k];
    }
    int ans = 0;
    if (findSlot(table, mask, endWord) >= 0) {
        int len = strlen(beginWord);
        int beginSlot = findSlot(table, mask, beginWord);
        if (beginSlot >= 0) visited[beginSlot] = 1;
        // Each word is queued at most once, plus beginWord itself.
        char** q = malloc(sizeof(char*) * (wordListSize + 1));
        int head = 0, tail = 0;
        q[tail++] = beginWord;
        char* buf = malloc(len + 1);
        for (int level = 2; head < tail && !ans; level++) {
            int end = tail;
            for (; head < end && !ans; head++) {
                memcpy(buf, q[head], len + 1);
                for (int j = 0; j < len && !ans; j++) {
                    char ch = buf[j];
                    for (char c = 'a'; c <= 'z'; c++) {
                        buf[j] = c;
                        int slot = findSlot(table, mask, buf);
                        if (slot < 0 || visited[slot]) continue;
                        if (strcmp(buf, endWord) == 0) {
                            ans = level;
                            break;
                        }
                        visited[slot] = 1;
                        q[tail++] = table[slot];
                    }
                    buf[j] = ch;
                }
            }
        }
        free(q);
        free(buf);
    }
    free(table);
    free(visited);
    return ans;
}
