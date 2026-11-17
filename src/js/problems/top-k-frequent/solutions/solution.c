// O(n + R log R) time for the value range R = 20001 - values are bounded, so a plain array
// indexed by value + 10^4 replaces the hash map.
#define OFFSET 10000
#define RANGE 20001

static int* counts;

static int cmpByRule(const void* a, const void* b) {
    int x = *(const int*)a, y = *(const int*)b;
    int cx = counts[x + OFFSET], cy = counts[y + OFFSET];
    if (cx != cy) return cy - cx;
    return x - y;
}

int* topKFrequent(int* nums, int numsSize, int k, int* returnSize) {
    counts = calloc(RANGE, sizeof(int));
    for (int i = 0; i < numsSize; i++) counts[nums[i] + OFFSET]++;
    int* values = malloc(sizeof(int) * RANGE);
    int d = 0;
    for (int v = 0; v < RANGE; v++) if (counts[v]) values[d++] = v - OFFSET;
    qsort(values, d, sizeof(int), cmpByRule);
    free(counts);
    *returnSize = k;
    return values;
}
