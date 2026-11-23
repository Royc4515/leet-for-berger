// O(n) time, O(1) extra space: cyclic placement of each value v in 1..n into index v - 1.
int smallestPositiveGap(int* nums, int numsSize) {
    for (int i = 0; i < numsSize; i++) {
        // Check bounds before computing nums[i] - 1 so INT_MIN never overflows.
        while (nums[i] >= 1 && nums[i] <= numsSize && nums[nums[i] - 1] != nums[i]) {
            int target = nums[i] - 1;
            int tmp = nums[i];
            nums[i] = nums[target];
            nums[target] = tmp;
        }
    }
    for (int i = 0; i < numsSize; i++) {
        if (nums[i] != i + 1) return i + 1;
    }
    return numsSize + 1;
}
