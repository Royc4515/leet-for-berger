// O(n log n + m log m) time - a cookie too small for the least greedy child is useless to all.
static int ascending(const void* x, const void* y) {
    int a = *(const int*)x, b = *(const int*)y;
    // Comparisons instead of a - b: values reach 2^31 - 1, so the subtraction would overflow.
    return (a > b) - (a < b);
}

int findContentChildren(int* g, int gSize, int* s, int sSize) {
    qsort(g, gSize, sizeof(int), ascending);
    qsort(s, sSize, sizeof(int), ascending);
    for (int i = 0, j = 0; i < gSize; i++) {
        // Skip cookies that cannot satisfy this child; they cannot satisfy anyone greedier either.
        while (j < sSize && s[j] < g[i]) j++;
        if (j++ >= sSize) return i;
    }
    return gSize;
}
