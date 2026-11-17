# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0034.Find%20First%20and%20Last%20Position%20of%20Element%20in%20Sorted%20Array/Solution.py
from bisect import bisect_left


def search_range(nums: list[int], target: int) -> list[int]:
    # O(log n) time - two lower bounds: the first index >= target and the first index >= target + 1.
    l = bisect_left(nums, target)
    r = bisect_left(nums, target + 1)
    # An empty run [l, r) means the target is absent.
    return [-1, -1] if l == r else [l, r - 1]
