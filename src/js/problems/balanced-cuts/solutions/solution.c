// O(n log(sum)) time: binary search the smallest cap for which a greedy pass needs at most k parts.
static bool balancedCutsFit(int* nums, int numsSize, int k, long long cap) {
    int parts = 1;
    long long current = 0;
    for (int i = 0; i < numsSize; i++) {
        // Closing a part as late as possible never hurts the parts after it.
        if (current + nums[i] > cap) {
            parts++;
            current = nums[i];
        } else {
            current += nums[i];
        }
    }
    return parts <= k;
}

long long minLargestPart(int* nums, int numsSize, int k) {
    // The total reaches 10^10, so the bounds and the midpoint are long long.
    long long low = 0, high = 0;
    for (int i = 0; i < numsSize; i++) {
        if (nums[i] > low) low = nums[i];
        high += nums[i];
    }
    while (low < high) {
        long long mid = (low + high) / 2;
        if (balancedCutsFit(nums, numsSize, k, mid)) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }
    return low;
}
