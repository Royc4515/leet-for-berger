# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1900-1999/1929.Concatenation%20of%20Array/Solution.py
def double_array(nums: list[int]) -> list[int]:
    # O(n) - list concatenation builds a new list of length 2n and leaves nums untouched.
    return nums + nums
