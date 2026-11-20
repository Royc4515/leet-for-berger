def min_largest_part(nums: list[int], k: int) -> int:
    # O(n log(sum)) time: binary search the smallest cap for which a greedy left-to-right pass
    # needs at most k parts. Python ints do not overflow, so the 10^10 totals need no care.
    def fits(cap: int) -> bool:
        parts = 1
        current = 0
        for v in nums:
            # Closing a part as late as possible never hurts the parts after it.
            if current + v > cap:
                parts += 1
                current = v
            else:
                current += v
        return parts <= k

    # No cap below the largest value can hold that value, and the total always fits in one part.
    low, high = max(nums), sum(nums)
    while low < high:
        mid = (low + high) // 2
        if fits(mid):
            high = mid
        else:
            low = mid + 1
    return low
