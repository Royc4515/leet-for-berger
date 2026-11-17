# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0295.Find%20Median%20from%20Data%20Stream/Solution.py
from heapq import heappop, heappush, heappushpop


class MedianFinder:
    # O(log n) per add, O(1) per query: a max-heap for the smaller half, a min-heap for the larger.

    def __init__(self):
        # heapq only has min-heaps, so the smaller half is stored negated.
        self.low = []
        self.high = []

    def add_num(self, num: int) -> None:
        # Route the number through the smaller half first, so the largest of it moves up and the
        # halves stay ordered whatever value arrives.
        heappush(self.high, -heappushpop(self.low, -num))
        # Keep the smaller half the same size or one larger, so its top is the odd-count median.
        if len(self.high) > len(self.low):
            heappush(self.low, -heappop(self.high))

    def find_median(self) -> int:
        if len(self.low) > len(self.high):
            return -2 * self.low[0]
        return self.high[0] - self.low[0]
