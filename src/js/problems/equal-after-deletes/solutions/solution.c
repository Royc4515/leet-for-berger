// O(n) time, O(n) space - a window that never shrinks; best is the highest count of one value seen.
int longestEqualSubarray(int* nums, int numsSize, int k) {
    int* count = calloc(numsSize + 1, sizeof(int));
    int best = 0, left = 0;
    for (int right = 0; right < numsSize; right++) {
        if (++count[nums[right]] > best) best = count[nums[right]];
        // Too many deletions needed: slide instead of grow. A stale best only stops the window from
        // growing, and growing again needs a real new best.
        if (right - left + 1 - best > k) count[nums[left++]]--;
    }
    free(count);
    return best;
}
