def longest_streak(nums: list[int]) -> int:
    # O(n) time - each run is walked once, from its first number only.
    values = set(nums)
    best = 0
    for x in values:
        if x - 1 in values:
            continue  # not a run start: the run will be counted from its first number
        length = 1
        while x + length in values:
            length += 1
        best = max(best, length)
    return best
