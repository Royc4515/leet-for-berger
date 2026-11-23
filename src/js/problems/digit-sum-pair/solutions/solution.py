def maximum_sum(nums: list[int]) -> int:
    # O(n) time - only the two largest numbers of a digit-sum group can form its best pair, so
    # remembering the largest number seen per digit sum (at most 81 sums) is enough.
    largest = [0] * 82
    best = -1
    for v in nums:
        s = sum(map(int, str(v)))
        # 0 means "nothing seen yet": every number is at least 1.
        if largest[s]:
            best = max(best, largest[s] + v)
        largest[s] = max(largest[s], v)
    return best
