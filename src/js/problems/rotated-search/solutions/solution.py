# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0033.Search%20in%20Rotated%20Sorted%20Array/Solution.py
def search(nums: list[int], target: int) -> int:
    # O(log n) time - at least one half of a rotated array is sorted; range-check the target there.
    n = len(nums)
    left, right = 0, n - 1
    # Narrow to one index that holds the target if it exists anywhere.
    while left < right:
        mid = (left + right) >> 1
        if nums[0] <= nums[mid]:
            # nums[0..mid] is sorted.
            if nums[0] <= target <= nums[mid]:
                right = mid
            else:
                left = mid + 1
        else:
            # nums[mid..n-1] is sorted.
            if nums[mid] < target <= nums[n - 1]:
                left = mid + 1
            else:
                right = mid
    return left if nums[left] == target else -1
