// O(n log n) time, O(n) space: a binary max-heap hands over the heaviest stone and accepts the
// difference. C has no heap in its library, so this one lives in a malloc'ed array.
static void stoneSiftUp(int* heap, int i) {
    while (i > 0) {
        int parent = (i - 1) / 2;
        if (heap[parent] >= heap[i]) break;
        int t = heap[parent];
        heap[parent] = heap[i];
        heap[i] = t;
        i = parent;
    }
}

static void stoneSiftDown(int* heap, int size, int i) {
    for (;;) {
        int heaviest = i;
        int left = 2 * i + 1;
        int right = left + 1;
        if (left < size && heap[left] > heap[heaviest]) heaviest = left;
        if (right < size && heap[right] > heap[heaviest]) heaviest = right;
        if (heaviest == i) break;
        int t = heap[heaviest];
        heap[heaviest] = heap[i];
        heap[i] = t;
        i = heaviest;
    }
}

static int stonePop(int* heap, int* size) {
    int top = heap[0];
    heap[0] = heap[--*size];
    stoneSiftDown(heap, *size, 0);
    return top;
}

int lastStoneWeight(int* stones, int stonesSize) {
    // Each round removes at least one stone, so the heap never grows beyond its first size.
    int* heap = malloc(sizeof(int) * stonesSize);
    int size = 0;
    for (int i = 0; i < stonesSize; i++) {
        heap[size] = stones[i];
        stoneSiftUp(heap, size++);
    }
    while (size > 1) {
        int first = stonePop(heap, &size);
        int second = stonePop(heap, &size);
        // Equal stones vanish; otherwise the difference goes back into the pile.
        if (first != second) {
            heap[size] = first - second;
            stoneSiftUp(heap, size++);
        }
    }
    int result = size ? heap[0] : 0;
    free(heap);
    return result;
}
