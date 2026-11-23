def count_bit_subarrays(nums: list[int], goal: int) -> int:
    # O(n) time, O(1) extra space: exact sum == goal equals at_most(goal) - at_most(goal - 1).
    def at_most(limit: int) -> int:
        if limit < 0:
            return 0
        left = 0
        window = 0
        total = 0
        for right, val in enumerate(nums):
            window += val
            while window > limit:
                window -= nums[left]
                left += 1
            total += right - left + 1
        return total

    return at_most(goal) - at_most(goal - 1)
