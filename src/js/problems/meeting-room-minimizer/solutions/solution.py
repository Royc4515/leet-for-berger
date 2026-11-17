def min_meeting_rooms(intervals: list[list[int]]) -> int:
    # O(n log n) time - only the order of start and end events matters, not which meeting owns them.
    starts = sorted(s for s, _ in intervals)
    ends = sorted(e for _, e in intervals)
    rooms = 0
    e = 0
    for s in starts:
        # ends[e] is the earliest time a busy room frees up. `<` because a meeting ending at s
        # has already left its room, so the new meeting can take it.
        if s < ends[e]:
            rooms += 1
        else:
            e += 1
    return rooms
