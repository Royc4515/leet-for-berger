def has_repeat(nums: list[int]) -> bool:
    # O(n) average time, O(n) space: track seen values and exit on the first collision.
    seen = set()
    for v in nums:
        if v in seen:
            return True
        seen.add(v)
    return False
