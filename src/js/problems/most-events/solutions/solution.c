// O(n log n + D) time - each day, attend the available event that ends soonest.
// C has no heap in its library, so this min-heap of end days lives in a malloc'ed array.
static int byStartDay(const void* x, const void* y) {
    int a = (*(int* const*)x)[0], b = (*(int* const*)y)[0];
    return (a > b) - (a < b);
}

static void endsPush(int* heap, int* size, int v) {
    int i = (*size)++;
    heap[i] = v;
    while (i > 0) {
        int parent = (i - 1) / 2;
        if (heap[parent] <= heap[i]) break;
        int t = heap[parent];
        heap[parent] = heap[i];
        heap[i] = t;
        i = parent;
    }
}

static void endsPop(int* heap, int* size) {
    heap[0] = heap[--*size];
    int i = 0;
    for (;;) {
        int smallest = i, left = 2 * i + 1, right = left + 1;
        if (left < *size && heap[left] < heap[smallest]) smallest = left;
        if (right < *size && heap[right] < heap[smallest]) smallest = right;
        if (smallest == i) break;
        int t = heap[smallest];
        heap[smallest] = heap[i];
        heap[i] = t;
        i = smallest;
    }
}

int maxEvents(int** events, int eventsSize, int* eventsColSize) {
    // Sort a copy of the row pointers: the caller's array is not ours to reorder.
    int** sorted = malloc(sizeof(int*) * eventsSize);
    memcpy(sorted, events, sizeof(int*) * eventsSize);
    qsort(sorted, eventsSize, sizeof(int*), byStartDay);
    int* heap = malloc(sizeof(int) * eventsSize);
    int size = 0, attended = 0, i = 0, day = 0;
    while (i < eventsSize || size > 0) {
        // Nothing available: jump to the next start day instead of walking empty days.
        if (size == 0 && sorted[i][0] > day) day = sorted[i][0];
        while (i < eventsSize && sorted[i][0] == day) endsPush(heap, &size, sorted[i++][1]);
        // Events that ended before today can no longer be attended.
        while (size > 0 && heap[0] < day) endsPop(heap, &size);
        if (size > 0) {
            endsPop(heap, &size);
            attended++;
        }
        day++;
    }
    free(heap);
    free(sorted);
    return attended;
}
