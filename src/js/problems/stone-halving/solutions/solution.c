// O(n + k log n) time - halving the current largest pile always removes the most stones.
// C has no heap in its library, so this max-heap lives in a malloc'ed array.
static void halvingSiftDown(int* heap, int size, int i) {
    for (;;) {
        int largest = i, left = 2 * i + 1, right = left + 1;
        if (left < size && heap[left] > heap[largest]) largest = left;
        if (right < size && heap[right] > heap[largest]) largest = right;
        if (largest == i) return;
        int t = heap[largest];
        heap[largest] = heap[i];
        heap[i] = t;
        i = largest;
    }
}

int minStoneSum(int* piles, int pilesSize, int k) {
    int* heap = malloc(sizeof(int) * pilesSize);
    int total = 0;
    for (int i = 0; i < pilesSize; i++) {
        heap[i] = piles[i];
        total += piles[i];
    }
    // Building the heap bottom-up is O(n), cheaper than n pushes.
    for (int i = pilesSize / 2 - 1; i >= 0; i--) halvingSiftDown(heap, pilesSize, i);
    for (int op = 0; op < k; op++) {
        // floor(p / 2) stones go; the smaller pile sinks back and may still be on top.
        total -= heap[0] / 2;
        heap[0] -= heap[0] / 2;
        halvingSiftDown(heap, pilesSize, 0);
    }
    free(heap);
    return total;
}
