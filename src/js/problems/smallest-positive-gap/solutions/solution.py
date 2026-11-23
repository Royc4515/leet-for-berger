def smallest_positive_gap(nums: list[int]) -> int:
    # O(n) time, O(1) extra space: place every value v in 1..n into index v - 1.
    n = len(nums)
    for i in range(n):
        while 1 <= nums[i] <= n and nums[nums[i] - 1] != nums[i]:
            target = nums[i] - 1
            nums[i], nums[target] = nums[target], nums[i]
    for i in range(n):
        if nums[i] != i + 1:
            return i + 1
    return n + 1
