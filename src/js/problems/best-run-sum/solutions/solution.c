// O(n) time - the best run ending at i either extends the one ending at i - 1 or starts at i.
int maxSubArray(int* nums, int numsSize) {
    // Start from nums[0], not 0: the run must be non-empty, so all-negative input stays negative.
    int ans = nums[0], run = nums[0];
    for (int i = 1; i < numsSize; i++) {
        // A negative running sum only drags the next element down, so drop it.
        run = (run > 0 ? run : 0) + nums[i];
        if (run > ans) ans = run;
    }
    return ans;
}
