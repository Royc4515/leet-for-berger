// O(n) time, O(1) extra space: exact sum == goal equals atMost(goal) - atMost(goal - 1).
static long long bitSubarraysAtMost(const int* nums, int n, int limit) {
    if (limit < 0) return 0;
    int left = 0;
    int window = 0;
    long long total = 0;
    for (int right = 0; right < n; right++) {
        window += nums[right];
        while (window > limit) {
            window -= nums[left];
            left++;
        }
        total += right - left + 1;
    }
    return total;
}

long long countBitSubarrays(int* nums, int numsSize, int goal) {
    return bitSubarraysAtMost(nums, numsSize, goal) - bitSubarraysAtMost(nums, numsSize, goal - 1);
}
