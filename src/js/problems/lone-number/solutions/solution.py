def single_number(nums: list[int]) -> int:
    # O(n) time, O(1) space - x ^ x == 0 and XOR is order independent, so every pair cancels
    # and only the lone value survives the fold.
    x = 0
    for v in nums:
        x ^= v
    return x
