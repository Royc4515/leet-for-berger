# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1800-1899/1822.Sign%20of%20the%20Product%20of%20an%20Array/Solution.py
def product_sign(nums: list[int]) -> int:
    # O(n) time, O(1) space - track only the sign; the product itself would be astronomically large.
    ans = 1
    for v in nums:
        # A zero decides the answer wherever it appears.
        if v == 0:
            return 0
        if v < 0:
            ans = -ans
    return ans
