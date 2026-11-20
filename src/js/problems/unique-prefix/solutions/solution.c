// O(n) time, O(1) extra space - compact into a fresh buffer, since the caller frees the result.
int* removeDuplicates(int* nums, int numsSize, int* returnSize) {
    int* out = malloc(sizeof(int) * (numsSize ? numsSize : 1));
    int write = 0;
    for (int read = 0; read < numsSize; read++) {
        // Sorted input: the last kept value is the only one a new value can repeat.
        if (write == 0 || nums[read] != out[write - 1]) out[write++] = nums[read];
    }
    *returnSize = write;
    return out;
}
