def next_arrangement(nums: list[int]) -> list[int]:
    # O(n) time, O(1) extra space: pivot = rightmost position that can still grow, swap it with the
    # rightmost larger value, then reverse the suffix so it is as small as possible.
    n = len(nums)
    i = n - 2
    # The suffix after the pivot is non-increasing; strict ">=" keeps equal values from counting as growable.
    while i >= 0 and nums[i] >= nums[i + 1]:
        i -= 1
    if i >= 0:
        j = n - 1
        while nums[j] <= nums[i]:
            j -= 1
        nums[i], nums[j] = nums[j], nums[i]
    # With no pivot (i = -1) this reverses the whole array: the last arrangement wraps to the first.
    l, r = i + 1, n - 1
    while l < r:
        nums[l], nums[r] = nums[r], nums[l]
        l += 1
        r -= 1
    return nums
