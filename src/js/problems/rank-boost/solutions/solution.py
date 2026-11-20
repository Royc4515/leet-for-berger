def rank_boost(nums: list[int]) -> int:
    # O(n log n) time, O(n) space. Sorted, the cheapest win for the smallest unbeaten value is the
    # next larger one, so one forward pointer finds every match.
    s = sorted(nums)
    j = 0
    for x in s:
        # j never passes the current index, so s[j] is always a value already seen or equal to x.
        if x > s[j]:
            j += 1
    return j
