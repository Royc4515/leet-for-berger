def merge(intervals: list[list[int]]) -> list[list[int]]:
    # O(n log n) time - after sorting by start, a range can only overlap the one being built.
    merged = []
    for start, end in sorted(intervals, key=lambda r: r[0]):
        # `<=` because ranges are closed: [1, 4] and [4, 5] share the point 4.
        if merged and start <= merged[-1][1]:
            # max, not end: the current range may already reach past this one.
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged
