def longest_equal_subarray(nums: list[int], k: int) -> int:
    # O(n) time, O(n) space - a window that never shrinks; best is the highest count of one value seen.
    count = [0] * (len(nums) + 1)
    best = left = 0
    for right, v in enumerate(nums):
        count[v] += 1
        best = max(best, count[v])
        # Too many deletions needed: slide instead of grow. A stale best only stops the window from
        # growing, and growing again needs a real new best.
        if right - left + 1 - best > k:
            count[nums[left]] -= 1
            left += 1
    return best
