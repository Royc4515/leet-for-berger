def flag_sort(nums: list[int]) -> list[int]:
    # O(n) time, O(1) extra space, one pass. [0, lo) holds 0s, [lo, mid) holds 1s, (hi, end] holds
    # 2s, and [mid, hi] is still unknown.
    lo, mid, hi = 0, 0, len(nums) - 1
    while mid <= hi:
        if nums[mid] == 0:
            nums[lo], nums[mid] = nums[mid], nums[lo]
            lo += 1
            mid += 1
        elif nums[mid] == 1:
            mid += 1
        else:
            nums[mid], nums[hi] = nums[hi], nums[mid]
            # mid stays: the value that just arrived from the right end has not been inspected.
            hi -= 1
    return nums
