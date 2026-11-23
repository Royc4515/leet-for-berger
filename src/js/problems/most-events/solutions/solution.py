import heapq


def max_events(events: list[list[int]]) -> int:
    # O(n log n + D) time - each day, attend the available event that ends soonest.
    events = sorted(events)
    ends = []
    attended = 0
    i = 0
    day = 0
    n = len(events)
    while i < n or ends:
        # Nothing available: jump to the next start day instead of walking empty days.
        if not ends:
            day = max(day, events[i][0])
        while i < n and events[i][0] == day:
            heapq.heappush(ends, events[i][1])
            i += 1
        # Events that ended before today can no longer be attended.
        while ends and ends[0] < day:
            heapq.heappop(ends)
        if ends:
            heapq.heappop(ends)
            attended += 1
        day += 1
    return attended
