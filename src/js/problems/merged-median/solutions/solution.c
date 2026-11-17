// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0004.Median%20of%20Two%20Sorted%20Arrays/Solution.c
// O(log(m + n)) time - find the k-th smallest of the union by discarding k/2 values per step.
static int findKth(int* nums1, int m, int i, int* nums2, int n, int j, int k) {
    if (i >= m) return nums2[j + k - 1];
    if (j >= n) return nums1[i + k - 1];
    if (k == 1) return nums1[i] < nums2[j] ? nums1[i] : nums2[j];
    int p = k / 2;
    // A side with fewer than p values left cannot hold the k-th among its first p, so the other side drops p.
    // No sentinel value: inputs span the whole int range, so any sentinel could collide with real data.
    if (i + p - 1 >= m) return findKth(nums1, m, i, nums2, n, j + p, k - p);
    if (j + p - 1 >= n) return findKth(nums1, m, i + p, nums2, n, j, k - p);
    if (nums1[i + p - 1] < nums2[j + p - 1])
        return findKth(nums1, m, i + p, nums2, n, j, k - p);
    return findKth(nums1, m, i, nums2, n, j + p, k - p);
}

long long medianTimesTwo(int* nums1, int nums1Size, int* nums2, int nums2Size) {
    int total = nums1Size + nums2Size;
    // Widen before adding: two values near 2^31 - 1 overflow an int.
    long long a = findKth(nums1, nums1Size, 0, nums2, nums2Size, 0, (total + 1) / 2);
    long long b = findKth(nums1, nums1Size, 0, nums2, nums2Size, 0, (total + 2) / 2);
    // The two middle positions coincide when the total is odd, which gives twice the middle value.
    return a + b;
}
