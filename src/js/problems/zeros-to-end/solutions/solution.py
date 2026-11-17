def move_zeroes(nums: list[int]) -> list[int]:
    # O(n) time, O(1) extra space - write pointer for the next non-zero slot, read pointer scans.
    write = 0
    for read in range(len(nums)):
        if nums[read] != 0:
            # Swapping (not copying) leaves the zeros behind, so no second fill pass is needed.
            nums[write], nums[read] = nums[read], nums[write]
            write += 1
    return nums
