def ring_shift(nums: list[int], k: int) -> list[int]:
    # O(n) time, O(1) extra space: reverse everything, then fix the two blocks separately.
    n = len(nums)
    # Shifting by n puts every value back where it was, so only k mod n matters (k can be 10^9).
    k %= n

    def reverse(lo: int, hi: int) -> None:
        while lo < hi:
            nums[lo], nums[hi] = nums[hi], nums[lo]
            lo += 1
            hi -= 1

    # The whole reversal brings the last k values to the front, but backwards; so are the rest.
    reverse(0, n - 1)
    reverse(0, k - 1)
    reverse(k, n - 1)
    return nums
