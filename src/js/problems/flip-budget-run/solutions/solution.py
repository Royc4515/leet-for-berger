def longest_run_with_flips(nums: list[int], k: int) -> int:
    # O(n) time, O(1) space: the answer is the longest window that holds at most k zeros. The left
    # edge only moves forward, so each element enters and leaves the window once.
    left = 0
    zeros = 0
    best = 0
    for right, v in enumerate(nums):
        if v == 0:
            zeros += 1
        # One new zero may be paid for by dropping many ones first, so this is a loop.
        while zeros > k:
            if nums[left] == 0:
                zeros -= 1
            left += 1
        best = max(best, right - left + 1)
    return best
