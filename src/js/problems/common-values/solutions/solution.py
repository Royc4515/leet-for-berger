# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0349.Intersection%20of%20Two%20Arrays/Solution.py
def common_values(nums1: list[int], nums2: list[int]) -> list[int]:
    # O(n + m + k log k) time: set lookups replace the O(n * m) nested loop.
    # The set intersection keeps each common value once; sorted() compares them as numbers.
    return sorted(set(nums1) & set(nums2))
