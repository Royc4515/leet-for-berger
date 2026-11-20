def remove_duplicates(nums: list[int]) -> list[int]:
    # O(n) time, O(1) extra space - compact the array in place, then return the kept prefix.
    write = 0
    for read in range(len(nums)):
        # Sorted input: the last kept value is the only one a new value can repeat.
        if write == 0 or nums[read] != nums[write - 1]:
            nums[write] = nums[read]
            write += 1
    return nums[:write]
