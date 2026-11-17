# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0004.Median%20of%20Two%20Sorted%20Arrays/Solution.py
def median_times_two(nums1: list[int], nums2: list[int]) -> int:
    # O(log(m + n)) time - find the k-th smallest of the union by discarding k/2 values per step.
    m, n = len(nums1), len(nums2)

    def f(i: int, j: int, k: int) -> int:
        if i >= m:
            return nums2[j + k - 1]
        if j >= n:
            return nums1[i + k - 1]
        if k == 1:
            return min(nums1[i], nums2[j])
        p = k // 2
        # A side with fewer than p values left cannot hold the k-th among its first p, so the other side drops p.
        x = nums1[i + p - 1] if i + p - 1 < m else inf
        y = nums2[j + p - 1] if j + p - 1 < n else inf
        return f(i + p, j, k - p) if x < y else f(i, j + p, k - p)

    inf = float("inf")
    # The two middle positions coincide when the total is odd, which gives twice the middle value.
    return f(0, 0, (m + n + 1) // 2) + f(0, 0, (m + n + 2) // 2)
