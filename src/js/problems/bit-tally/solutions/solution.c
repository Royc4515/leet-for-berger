// O(n) time - i >> 1 drops the lowest bit of i, and its count is already in the table.
int* countBits(int n, int* returnSize) {
    // n + 1 entries: the count for n itself is part of the answer.
    int* tally = malloc(sizeof(int) * (n + 1));
    tally[0] = 0;
    for (int i = 1; i <= n; i++) tally[i] = tally[i >> 1] + (i & 1);
    *returnSize = n + 1;
    return tally;
}
