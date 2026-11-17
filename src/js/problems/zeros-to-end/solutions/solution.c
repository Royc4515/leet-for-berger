// O(n) time - write pointer for the next non-zero slot, read pointer scans.
int* moveZeroes(int* nums, int numsSize, int* returnSize) {
    // The caller frees the result, and the input array is not ours to hand back, so copy into
    // a fresh buffer as the compaction runs.
    int* out = malloc(sizeof(int) * (numsSize ? numsSize : 1));
    int write = 0;
    for (int read = 0; read < numsSize; read++) {
        if (nums[read] != 0) out[write++] = nums[read];
    }
    while (write < numsSize) out[write++] = 0;
    *returnSize = numsSize;
    return out;
}
