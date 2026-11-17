// O(n log n) - sweep the edges left to right with a max-heap of the buildings already started.
// Finished buildings are removed lazily, only when they reach the top: the top is all that
// matters, and searching the heap for them would be O(n). C has no priority queue, so a small
// array-backed one is written out here.
typedef struct { int height, right; } Item;

static void heapPush(Item* h, int* size, Item item) {
    int i = (*size)++;
    while (i > 0 && h[(i - 1) / 2].height < item.height) {
        h[i] = h[(i - 1) / 2];
        i = (i - 1) / 2;
    }
    h[i] = item;
}

static void heapPop(Item* h, int* size) {
    Item last = h[--(*size)];
    int i = 0;
    for (;;) {
        int c = 2 * i + 1;
        if (c >= *size) break;
        if (c + 1 < *size && h[c + 1].height > h[c].height) c++;
        if (h[c].height <= last.height) break;
        h[i] = h[c];
        i = c;
    }
    if (*size > 0) h[i] = last;
}

// Compare, not subtract: coordinates near 2^31 would overflow a difference.
static int cmpInt(const void* a, const void* b) {
    int x = *(const int*)a, y = *(const int*)b;
    return (x > y) - (x < y);
}

int** getSkyline(int** buildings, int buildingsSize, int* buildingsColSize, int* returnSize, int** returnColumnSizes) {
    int n = buildingsSize;
    int* lines = malloc(sizeof(int) * 2 * n);
    for (int i = 0; i < n; i++) {
        lines[2 * i] = buildings[i][0];
        lines[2 * i + 1] = buildings[i][1];
    }
    qsort(lines, 2 * n, sizeof(int), cmpInt);
    Item* heap = malloc(sizeof(Item) * n);
    int size = 0, city = 0, count = 0;
    // At most one key point per edge coordinate.
    int** skys = malloc(sizeof(int*) * 2 * n);
    for (int k = 0; k < 2 * n; k++) {
        int line = lines[k];
        while (city < n && buildings[city][0] <= line) {
            Item item = {buildings[city][2], buildings[city][1]};
            heapPush(heap, &size, item);
            city++;
        }
        while (size > 0 && heap[0].right <= line) heapPop(heap, &size);
        int high = size > 0 ? heap[0].height : 0;
        // Only a change of height is a key point; a repeated x gives the same height again.
        if (count > 0 && skys[count - 1][1] == high) continue;
        skys[count] = malloc(sizeof(int) * 2);
        skys[count][0] = line;
        skys[count][1] = high;
        count++;
    }
    free(lines);
    free(heap);
    *returnSize = count;
    *returnColumnSizes = malloc(sizeof(int) * (count ? count : 1));
    for (int i = 0; i < count; i++) (*returnColumnSizes)[i] = 2;
    return skys;
}
