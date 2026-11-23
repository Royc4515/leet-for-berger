// O(n) average time, O(n) space: open-addressing hash set with power-of-two capacity.
bool hasRepeat(int* nums, int numsSize) {
    size_t cap = 16;
    // Keep load factor at or below 50% so linear probing stays O(1) on average.
    while (cap < (size_t)numsSize * 2) cap <<= 1;
    int* keys = malloc(cap * sizeof(int));
    unsigned char* used = calloc(cap, 1);
    size_t mask = cap - 1;
    bool found = false;

    for (int i = 0; i < numsSize; i++) {
        int v = nums[i];
        // Mix bits with Knuth's multiplicative hash to avoid clustering on sequential integers.
        size_t idx = ((unsigned int)v * 2654435761u) & mask;
        while (used[idx]) {
            if (keys[idx] == v) {
                found = true;
                break;
            }
            idx = (idx + 1) & mask;
        }
        if (found) break;
        used[idx] = 1;
        keys[idx] = v;
    }

    free(keys);
    free(used);
    return found;
}
