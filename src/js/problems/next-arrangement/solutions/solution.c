// O(n) time, O(1) extra space: pivot = rightmost position that can still grow, swap it with the
// rightmost larger value, then reverse the suffix so it is as small as possible.
int* nextArrangement(int* nums, int numsSize, int* returnSize) {
    int n = numsSize;
    int i = n - 2;
    // The suffix after the pivot is non-increasing; strict ">=" keeps equal values from counting as growable.
    while (i >= 0 && nums[i] >= nums[i + 1]) i--;
    if (i >= 0) {
        int j = n - 1;
        while (nums[j] <= nums[i]) j--;
        int t = nums[i];
        nums[i] = nums[j];
        nums[j] = t;
    }
    // With no pivot (i = -1) this reverses the whole array: the last arrangement wraps to the first.
    for (int l = i + 1, r = n - 1; l < r; l++, r--) {
        int t = nums[l];
        nums[l] = nums[r];
        nums[r] = t;
    }
    // The input array was rewritten in place and is the answer; only its size is reported.
    *returnSize = n;
    return nums;
}
