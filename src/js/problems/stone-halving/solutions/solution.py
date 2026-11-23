import heapq


def min_stone_sum(piles: list[int], k: int) -> int:
    # O(n + k log n) time - halving the current largest pile always removes the most stones.
    # heapq is a min-heap, so the piles go in negated.
    heap = [-p for p in piles]
    heapq.heapify(heap)
    for _ in range(k):
        largest = -heap[0]
        # floor(p / 2) stones go, so p - p // 2 stay; the pile may still be the largest.
        heapq.heapreplace(heap, -(largest - largest // 2))
    return -sum(heap)
