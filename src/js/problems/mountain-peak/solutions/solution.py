# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0162.Find%20Peak%20Element/Solution.py
def find_peak_element(nums: list[int]) -> int:
    # O(log n) time - nums[mid] < nums[mid + 1] means mid is on the rising slope, so the peak is right of it.
    left, right = 0, len(nums) - 1
    # left < right keeps mid < right, so mid + 1 is always a valid index.
    while left < right:
        mid = (left + right) >> 1
        if nums[mid] > nums[mid + 1]:
            # Falling: the peak is mid itself or somewhere to its left.
            right = mid
        else:
            left = mid + 1
    return left
