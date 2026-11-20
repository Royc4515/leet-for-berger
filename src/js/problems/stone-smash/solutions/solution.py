import heapq


def last_stone_weight(stones: list[int]) -> int:
    # O(n log n) time, O(n) space: a heap hands over the heaviest stone and accepts the difference.
    # heapq is a min-heap, so weights are stored negated to make the heaviest stone come out first.
    heap = [-w for w in stones]
    heapq.heapify(heap)
    while len(heap) > 1:
        first = -heapq.heappop(heap)
        second = -heapq.heappop(heap)
        # Equal stones vanish; otherwise the difference goes back into the pile.
        if first != second:
            heapq.heappush(heap, -(first - second))
    return -heap[0] if heap else 0
