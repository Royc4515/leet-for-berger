def count_splits(ranges: list[list[int]]) -> int:
    # O(n log n) - ranges that overlap through a chain must share a group, so they form blocks
    # (the merged intervals) and each block independently picks group 1 or 2: 2^blocks ways.
    blocks = 0
    reach = -1  # furthest end seen so far
    for start, end in sorted(ranges):
        # `>` and not `>=`: ranges are closed, so a range starting at `reach` still shares it.
        if start > reach:
            blocks += 1
        # max, not end: a nested range must not shorten the reach of the one around it.
        reach = max(reach, end)
    # The modulus is part of the power: 2^100000 is far beyond any fixed-width integer.
    return pow(2, blocks, 10**9 + 7)
