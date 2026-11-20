// O(n log n + L log n): sort once, then for each typed prefix the matching names form one block
// that starts at the first name that is not smaller than the prefix.
static int cmpNames(const void* a, const void* b) {
    return strcmp(*(char* const*)a, *(char* const*)b);
}

char*** suggestNames(char** products, int productsSize, char* searchWord, int* returnSize, int** returnColumnSizes) {
    // Sorting a copy of the pointer array leaves the caller's array alone.
    char** sorted = malloc(sizeof(char*) * productsSize);
    memcpy(sorted, products, sizeof(char*) * productsSize);
    qsort(sorted, productsSize, sizeof(char*), cmpNames);
    int len = (int)strlen(searchWord);
    char*** out = malloc(sizeof(char**) * len);
    int* sizes = malloc(sizeof(int) * len);
    int start = 0;
    for (int i = 1; i <= len; i++) {
        // A longer prefix keeps only a subset of the shorter one's matches, so the search can
        // begin where the previous one ended. strncmp against the first i letters compares the
        // name with the prefix without copying it, and a name shorter than the prefix compares
        // lower because its terminator is smaller than any letter.
        int low = start, high = productsSize;
        while (low < high) {
            int mid = low + (high - low) / 2;
            if (strncmp(sorted[mid], searchWord, i) < 0) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        start = low;
        int count = 0;
        out[i - 1] = malloc(sizeof(char*) * 3);
        for (int j = start; j < productsSize && count < 3 && strncmp(sorted[j], searchWord, i) == 0; j++) {
            out[i - 1][count++] = sorted[j];
        }
        sizes[i - 1] = count;
    }
    free(sorted);
    *returnSize = len;
    *returnColumnSizes = sizes;
    return out;
}
