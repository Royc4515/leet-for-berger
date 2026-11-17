# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0400-0499/0435.Non-overlapping%20Intervals/Solution.py
def erase_overlap_intervals(intervals: list[list[int]]) -> int:
    # O(n log n) time - keeping the interval that ends first leaves the most room for the rest.
    ans = len(intervals)
    last_end = float('-inf')
    for start, end in sorted(intervals, key=lambda r: r[1]):
        # '>=' because touching at an endpoint is not an overlap.
        if start >= last_end:
            ans -= 1
            last_end = end
    return ans
