// O(log n) time - two lower bounds: the first index >= target and the first index >= target + 1.
static int lowerBound(int* nums, int n, int x) {
    int left = 0, right = n;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] >= x) right = mid;
        else left = mid + 1;
    }
    return left;
}

int* searchRange(int* nums, int numsSize, int target, int* returnSize) {
    // target + 1 cannot overflow: |target| <= 10^9.
    int l = lowerBound(nums, numsSize, target);
    int r = lowerBound(nums, numsSize, target + 1);
    int* out = malloc(sizeof(int) * 2);
    // An empty run [l, r) means the target is absent.
    out[0] = l == r ? -1 : l;
    out[1] = l == r ? -1 : r - 1;
    *returnSize = 2;
    return out;
}
