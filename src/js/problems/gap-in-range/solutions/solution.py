def missing_number(nums: list[int]) -> int:
    # O(n) time, O(1) space - xor every index 0..n with every value; present numbers cancel in pairs.
    result = len(nums)
    for i, v in enumerate(nums):
        result ^= i ^ v
    return result
