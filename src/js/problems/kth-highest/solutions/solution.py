# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0215.Kth%20Largest%20Element%20in%20an%20Array/Solution.py
def find_kth_largest(nums: list[int], k: int) -> int:
    # O(n) average - quickselect: partition around a pivot, then continue in one side only.
    # The k-th largest is the value at index n - k in ascending order.
    target = len(nums) - k
    l, r = 0, len(nums) - 1
    # A loop instead of recursion: only one side is ever revisited.
    while l < r:
        i, j = l - 1, r + 1
        # The middle element as pivot keeps sorted input balanced, and Hoare partitioning stops
        # on equal values from both sides, so all-equal input splits in half instead of n - 1 : 1.
        x = nums[(l + r) >> 1]
        while i < j:
            i += 1
            while nums[i] < x:
                i += 1
            j -= 1
            while nums[j] > x:
                j -= 1
            if i < j:
                nums[i], nums[j] = nums[j], nums[i]
        # Everything in [l, j] is <= x and everything in [j + 1, r] is >= x.
        if j < target:
            l = j + 1
        else:
            r = j
    return nums[l]
