// O(n) time - a deque of indices whose values strictly decrease from front to back.
int* maxSlidingWindow(int* nums, int numsSize, int k, int* returnSize) {
    // Each index is pushed once, so an array of n slots with head and tail is enough.
    int* dq = malloc(sizeof(int) * numsSize);
    int head = 0, tail = 0;
    int* out = malloc(sizeof(int) * (numsSize - k + 1));
    for (int i = 0; i < numsSize; i++) {
        // A value no larger than the newcomer can never be a maximum again: it leaves first.
        while (tail > head && nums[dq[tail - 1]] <= nums[i]) tail--;
        dq[tail++] = i;
        // The front is the window maximum unless it has slid out on the left.
        if (dq[head] <= i - k) head++;
        if (i >= k - 1) out[i - k + 1] = nums[dq[head]];
    }
    free(dq);
    *returnSize = numsSize - k + 1;
    return out;
}
