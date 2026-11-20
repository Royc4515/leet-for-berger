def min_daily_limit(weights: list[int], days: int) -> int:
    # O(n log(sum)) time: if a limit works, every larger limit works, so binary search the smallest
    # limit whose greedy pass needs at most `days` days.
    def fits(limit: int) -> bool:
        used = 1
        load = 0
        for w in weights:
            # A load equal to the limit is allowed, so a new day starts only when it would be passed.
            if load + w > limit:
                used += 1
                load = 0
            load += w
        return used <= days

    # Every package must fit on a day by itself, and one day carries everything at the total.
    lo, hi = max(weights), sum(weights)
    while lo < hi:
        mid = (lo + hi) // 2
        if fits(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
