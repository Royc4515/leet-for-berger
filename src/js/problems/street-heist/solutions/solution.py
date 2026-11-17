# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0198.House%20Robber/Solution.py
def rob(nums: list[int]) -> int:
    # O(n) time, O(1) space - best(i) = max(best(i - 1), best(i - 2) + nums[i]).
    # Iterative rather than recursive: 10^5 houses would overflow Python's recursion limit.
    prev, cur = 0, 0  # best totals for the prefixes ending one and zero houses back
    for x in nums:
        # Either skip this house (keep cur) or take it on top of the best that skips its neighbor.
        prev, cur = cur, max(cur, prev + x)
    return cur
