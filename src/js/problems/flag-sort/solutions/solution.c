// O(n) time, O(1) extra space, one pass. [0, lo) holds 0s, [lo, mid) holds 1s, (hi, end] holds 2s,
// and [mid, hi] is still unknown.
int* flagSort(int* nums, int numsSize, int* returnSize) {
    int lo = 0, mid = 0, hi = numsSize - 1;
    while (mid <= hi) {
        if (nums[mid] == 0) {
            int t = nums[lo];
            nums[lo] = nums[mid];
            nums[mid] = t;
            lo++;
            mid++;
        } else if (nums[mid] == 1) {
            mid++;
        } else {
            int t = nums[mid];
            nums[mid] = nums[hi];
            nums[hi] = t;
            // mid stays: the value that just arrived from the right end has not been inspected.
            hi--;
        }
    }
    // The input array was rewritten in place and is the answer; only its size is reported.
    *returnSize = numsSize;
    return nums;
}
