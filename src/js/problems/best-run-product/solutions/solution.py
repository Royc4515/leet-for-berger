# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0152.Maximum%20Product%20Subarray/Solution.py
def max_product(nums: list[int]) -> int:
    # O(n) time - a negative factor swaps the largest and smallest products, so keep both.
    ans = f = g = nums[0]  # f: largest, g: smallest product of a run ending here
    for x in nums[1:]:
        # Use the old f and g for both updates; x alone covers starting a new run (after a 0).
        ff, gg = f, g
        f = max(x, ff * x, gg * x)
        g = min(x, ff * x, gg * x)
        ans = max(ans, f)
    return ans
