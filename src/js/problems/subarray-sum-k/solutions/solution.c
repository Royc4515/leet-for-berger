// O(n) expected time - a subarray (i, j] sums to k exactly when prefix[j] - prefix[i] == k.
// C has no hash map, so this is a small open-addressing table keyed by prefix sum.
typedef struct {
    long long* keys;
    int* counts;
    char* used;
    unsigned mask;
} PrefixTable;

static unsigned slotOf(PrefixTable* t, long long key) {
    // Multiplicative hashing spreads nearby prefix sums across the table.
    unsigned h = (unsigned)(((unsigned long long)key * 0x9E3779B97F4A7C15ULL) >> 32) & t->mask;
    while (t->used[h] && t->keys[h] != key) h = (h + 1) & t->mask;
    return h;
}

long long subarraySum(int* nums, int numsSize, int k) {
    // At most numsSize + 1 distinct prefixes; a load factor under 1/2 keeps probes short.
    unsigned cap = 1;
    while (cap < 2u * (unsigned)(numsSize + 1)) cap <<= 1;
    PrefixTable t = { malloc(sizeof(long long) * cap), malloc(sizeof(int) * cap), calloc(cap, 1), cap - 1 };
    // Seeding prefix 0 once counts subarrays that start at index 0.
    unsigned s = slotOf(&t, 0);
    t.used[s] = 1; t.keys[s] = 0; t.counts[s] = 1;
    long long prefix = 0;
    long long count = 0; // up to n(n+1)/2, about 5 * 10^9: overflows an int
    for (int i = 0; i < numsSize; i++) {
        prefix += nums[i];
        // Look up before inserting, so the empty subarray (i == j) is never counted.
        unsigned q = slotOf(&t, prefix - k);
        if (t.used[q]) count += t.counts[q];
        s = slotOf(&t, prefix);
        if (!t.used[s]) { t.used[s] = 1; t.keys[s] = prefix; t.counts[s] = 0; }
        t.counts[s]++;
    }
    free(t.keys); free(t.counts); free(t.used);
    return count;
}
