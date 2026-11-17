// O(log n) per add, O(1) per query: a max-heap for the smaller half, a min-heap for the larger.
// C has no priority queue, so both halves use one small binary heap. The larger half is stored
// negated in a max-heap; negating as long long keeps -(-2^31) representable.
typedef struct {
    long long* a;
    int size, cap;
} Heap;

static void heapPush(Heap* h, long long v) {
    if (h->size == h->cap) {
        h->cap = h->cap ? h->cap * 2 : 16;
        h->a = realloc(h->a, sizeof(long long) * h->cap);
    }
    int i = h->size++;
    h->a[i] = v;
    while (i > 0) {
        int p = (i - 1) / 2;
        if (h->a[p] >= h->a[i]) break;
        long long t = h->a[p];
        h->a[p] = h->a[i];
        h->a[i] = t;
        i = p;
    }
}

static long long heapPop(Heap* h) {
    long long top = h->a[0];
    h->a[0] = h->a[--h->size];
    int i = 0;
    for (;;) {
        int l = 2 * i + 1, r = l + 1, m = i;
        if (l < h->size && h->a[l] > h->a[m]) m = l;
        if (r < h->size && h->a[r] > h->a[m]) m = r;
        if (m == i) break;
        long long t = h->a[m];
        h->a[m] = h->a[i];
        h->a[i] = t;
        i = m;
    }
    return top;
}

typedef struct {
    Heap low;  // smaller half, max on top
    Heap high; // larger half, stored negated so its minimum is on top
} MedianFinder;

MedianFinder* medianFinderCreate() {
    MedianFinder* obj = calloc(1, sizeof(MedianFinder));
    return obj;
}

void medianFinderAddNum(MedianFinder* obj, int num) {
    // Route the number through the smaller half first, so the largest of it moves up and the
    // halves stay ordered whatever value arrives.
    heapPush(&obj->low, num);
    heapPush(&obj->high, -heapPop(&obj->low));
    // Keep the smaller half the same size or one larger, so its top is the odd-count median.
    if (obj->high.size > obj->low.size) heapPush(&obj->low, -heapPop(&obj->high));
}

long long medianFinderFindMedian(MedianFinder* obj) {
    if (obj->low.size > obj->high.size) return 2 * obj->low.a[0];
    return obj->low.a[0] - obj->high.a[0];
}

void medianFinderFree(MedianFinder* obj) {
    free(obj->low.a);
    free(obj->high.a);
    free(obj);
}
