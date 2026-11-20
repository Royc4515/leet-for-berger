def max_points(nums: list[int]) -> int:
    # O(n + max(nums)) - taking a value takes all its copies, so each value is worth
    # v * count[v], and it conflicts only with v - 1 and v + 1: house robber on the value line.
    total = [0] * (max(nums) + 1)
    for v in nums:
        total[v] += v
    skip = 0  # best score using values up to v - 2
    best = 0  # best score using values up to v - 1
    for v in range(1, len(total)):
        # Absent values have total 0, so a gap in the values lets both neighbours be taken.
        skip, best = best, max(best, skip + total[v])
    return best
