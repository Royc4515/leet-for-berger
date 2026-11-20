def min_start_value(nums: list[int]) -> int:
    # O(n) time, O(1) space: after k steps the total is start + prefix[k], so the tightest moment
    # is the lowest prefix sum. The lowest starts at 0 ("no steps yet") so the answer is at least 1.
    total = 0
    lowest = 0
    for v in nums:
        total += v
        lowest = min(lowest, total)
    return 1 - lowest
