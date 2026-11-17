def pair_sum(nums: list[int], target: int) -> list[int]:
    # O(n) time, O(n) space - one pass, value -> index.
    seen = {}
    for j, x in enumerate(nums):
        # Look before storing x, so a position is never paired with itself.
        i = seen.get(target - x)
        if i is not None:
            return [i, j]
        seen[x] = j
    return []
