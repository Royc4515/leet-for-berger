# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0218.The%20Skyline%20Problem/Solution.py
import heapq


def get_skyline(buildings: list[list[int]]) -> list[list[int]]:
    # O(n log n) - sweep the edges left to right with a max-heap of the buildings already
    # started, as (-height, right). Finished buildings are removed lazily, only when they reach
    # the top: the top is all that matters, and searching the heap for them would be O(n).
    skys, pq = [], []
    lines = sorted({x for b in buildings for x in b[:2]})
    city, n = 0, len(buildings)
    for line in lines:
        while city < n and buildings[city][0] <= line:
            heapq.heappush(pq, (-buildings[city][2], buildings[city][1]))
            city += 1
        while pq and pq[0][1] <= line:
            heapq.heappop(pq)
        high = -pq[0][0] if pq else 0
        # Only a change of height is a key point.
        if skys and skys[-1][1] == high:
            continue
        skys.append([line, high])
    return skys
